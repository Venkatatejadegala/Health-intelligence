const DailyLog = require('../models/DailyLog');
const UserProfile = require('../models/UserProfile');
const CoachingInsight = require('../models/CoachingInsight');
const analyticsService = require('./analytics.service');
const localDb = require('./localDb.service');
const mongoose = require('mongoose');
const crypto = require('crypto');

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

function clampLogsForPrompt(logs) {
  return logs.map((log) => ({
    date: log.date,
    caloriesConsumed: log.caloriesConsumed,
    proteinConsumed: log.proteinConsumed,
    carbsConsumed: log.carbsConsumed,
    fatConsumed: log.fatConsumed,
    waterIntake: log.waterIntake,
    didWorkout: log.didWorkout,
    sleepHours: log.sleepHours,
    stressLevel: log.stressLevel,
    energyLevel: log.energyLevel,
    mood: log.mood,
    recoveryScore: log.recoveryScore,
    weight: log.weight
  }));
}

function extractJson(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    return null;
  }

  try {
    return JSON.parse(match[0]);
  } catch (error) {
    return null;
  }
}

class AiCoachService {
  async buildUserContext(userId) {
    const [profile, logs, averages, adherence, predictions] = await Promise.all([
      UserProfile.findOne({ userId }).lean(),
      DailyLog.find({ userId }).sort({ date: -1 }).limit(30).lean(),
      analyticsService.calculateRollingAverages(userId),
      analyticsService.calculateAdherenceScore(userId),
      analyticsService.getPredictiveInsights(userId)
    ]);

    return {
      profile,
      analytics: {
        averages,
        adherence,
        predictions
      },
      recentLogs: clampLogsForPrompt(logs.reverse())
    };
  }

  async generateCoachInsight(userId, question = '', persona = 'scientific') {
    const context = await this.buildUserContext(userId);

    // Compute a hash based on the user context analytics, the question, and the persona
    const rawContextString = JSON.stringify(context.analytics) + question + persona;
    const contextHash = crypto.createHash('md5').update(rawContextString).digest('hex');

    // Attempt cache retrieval
    let cached = null;
    try {
      if (mongoose.connection.readyState === 1) {
        cached = await CoachingInsight.findOne({ userId, contextHash }).sort({ createdAt: -1 }).lean();
      } else {
        const insights = await localDb.findCoachingInsights(userId);
        cached = insights.find((c) => c.contextHash === contextHash);
      }
    } catch (cacheErr) {
      console.error('Failed to query cached coaching insights:', cacheErr);
    }

    if (cached) {
      console.log('Returning cached coaching insight (hash hit)');
      return {
        source: cached.insight.source || 'cached-gemini',
        generatedAt: cached.createdAt || new Date().toISOString(),
        context,
        insight: cached.insight
      };
    }

    if (!process.env.GEMINI_API_KEY) {
      const fallback = this.fallbackInsight(context, 'GEMINI_API_KEY is not configured on the backend.');
      
      // Cache the fallback insight so it doesn't run rule engine repeatedly
      try {
        if (mongoose.connection.readyState === 1) {
          await CoachingInsight.create({ userId, persona, question, insight: fallback.insight, contextHash });
        } else {
          await localDb.saveCoachingInsight(userId, { persona, question, insight: fallback.insight, contextHash });
        }
      } catch (saveFallbackErr) {
        console.error('Failed to save fallback coaching insight:', saveFallbackErr);
      }
      return fallback;
    }

    const prompt = this.createPrompt(context, question, persona);
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }]
            }
          ],
          generationConfig: {
            temperature: 0.45,
            responseMimeType: 'application/json'
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        return this.fallbackInsight(context, `Gemini request failed: ${errorText}`);
      }

      const payload = await response.json();
      const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const parsed = extractJson(text);

      if (!parsed) {
        return this.fallbackInsight(context, 'Gemini returned a response that could not be parsed as JSON.');
      }

      // Log AI usage to database
      try {
        const tokens = payload?.usageMetadata?.totalTokenCount || Math.ceil((prompt.length + text.length) / 4);
        const aiLogger = require('./aiLogger.service');
        await aiLogger.logUsage(userId, 'coach-insight', tokens);
      } catch (logErr) {
        console.error('Failed to log AI usage:', logErr);
      }

      const result = {
        source: 'gemini',
        generatedAt: new Date().toISOString(),
        context,
        insight: parsed
      };

      // Cache the successful insight
      try {
        if (mongoose.connection.readyState === 1) {
          await CoachingInsight.create({ userId, persona, question, insight: parsed, contextHash });
        } else {
          await localDb.saveCoachingInsight(userId, { persona, question, insight: parsed, contextHash });
        }
      } catch (saveErr) {
        console.error('Failed to save generated coaching insight:', saveErr);
      }

      return result;
    } catch (err) {
      console.error('Failed to generate insight via Gemini API:', err);
      return this.fallbackInsight(context, `Gemini service error: ${err.message}`);
    }
  }

  createPrompt(context, question, persona) {
    let personaPrompt = "";
    if (persona === 'direct') {
      personaPrompt = "Adopt a Direct, No-Fluff, Tough-Love coach persona. Be extremely concise, firm, highly motivational but straightforward. Call out gaps immediately without sugarcoating.";
    } else if (persona === 'scientific') {
      personaPrompt = "Adopt a Scientific Biohacker persona. Use precise physiological terminology (e.g., BMR, TDEE, hypertrophic stimuli, muscle protein synthesis, mechanical tension, recovery HRV). Back recommendations with scientific principles of training and nutrition.";
    } else if (persona === 'empathetic') {
      personaPrompt = "Adopt an Empathetic Wellness Coach persona. Be highly supportive, encouraging, and focused on stress management, sleep quality, sustainable long-term habits, and overall mental-physical harmony.";
    }

    return `
You are the AI health analyst inside a gym-focused health intelligence platform.
${personaPrompt}
Use only the user data provided. Do not give generic advice.

Return one valid JSON object with exactly this shape:
{
  "summary": "2 sentence personalized summary in your designated persona voice",
  "riskLevel": "low | medium | high",
  "primaryPattern": "specific pattern found in the data",
  "recommendations": [
    {
      "title": "short action",
      "why": "metric-backed reason",
      "action": "specific next step",
      "category": "nutrition | workout | recovery | behavior"
    }
  ],
  "nextCheckInMetric": "metric the user should watch next"
}

User question: ${question || 'Generate today\'s adaptive coaching insight.'}
User context JSON:
${JSON.stringify(context, null, 2)}
`;
  }

  fallbackInsight(context, reason) {
    const adherence = context.analytics?.adherence?.totalScore || 0;
    const calories = context.analytics?.averages?.avgCalories7d || 0;
    const protein = context.analytics?.averages?.avgProtein7d || 0;
    const risk = adherence >= 75 ? 'low' : adherence >= 50 ? 'medium' : 'high';

    return {
      source: 'rules',
      generatedAt: new Date().toISOString(),
      warning: reason,
      context,
      insight: {
        summary: `Your current adherence score is ${adherence}/100 with a 7-day average of ${calories} calories and ${protein}g protein. The system needs more configured AI context for deeper coaching, but your near-term focus is clear from the logged trend.`,
        riskLevel: risk,
        primaryPattern: adherence < 60
          ? 'Adherence is below the stable-progress zone.'
          : 'Adherence is currently strong enough to support goal progress.',
        recommendations: [
          {
            title: 'Stabilize the next 3 days',
            why: `The adherence score is ${adherence}/100.`,
            action: 'Hit calorie target within 200 kcal, protein within 10%, and complete the next scheduled workout.',
            category: 'behavior'
          }
        ],
        nextCheckInMetric: '7-day adherence score'
      }
    };
  }
}

module.exports = new AiCoachService();
