const DailyLog = require('../models/DailyLog');
const BodyProgress = require('../models/BodyProgress');
const UserProfile = require('../models/UserProfile');
const CoachingInsight = require('../models/CoachingInsight');
const analyticsService = require('./analytics.service');
const nutritionIntelligence = require('./nutritionIntelligence.service');
const progressionService = require('./progression.service');
const mongoose = require('mongoose');

const buildReadinessScore = (logs) => {
    const recent = logs.slice(-7);
    if (!recent.length) return { score: 50, label: 'needs data', drivers: ['Log sleep, energy, workouts, and hydration.'] };

    const avgSleep = recent.reduce((sum, log) => sum + (Number(log.sleepHours) || 0), 0) / recent.length;
    const avgEnergy = recent.reduce((sum, log) => sum + (Number(log.energyLevel) || 5), 0) / recent.length;
    const avgRecovery = recent.reduce((sum, log) => sum + (Number(log.recoveryScore) || 70), 0) / recent.length;
    const hydrationDays = recent.filter((log) => (Number(log.waterIntake) || 0) >= 2500).length;

    const score = Math.round(
        Math.min(100, (avgSleep / 8) * 32 + (avgEnergy / 10) * 28 + (avgRecovery / 100) * 30 + (hydrationDays / recent.length) * 10)
    );

    return {
        score,
        label: score >= 80 ? 'primed' : score >= 60 ? 'train normally' : score >= 40 ? 'manage fatigue' : 'recovery priority',
        drivers: [
            avgSleep < 6.5 ? 'sleep debt' : null,
            avgEnergy < 5 ? 'low energy' : null,
            avgRecovery < 65 ? 'recovery score is low' : null,
            hydrationDays < 4 ? 'hydration inconsistency' : null
        ].filter(Boolean)
    };
};

module.exports = {
    async buildOverview(userId) {
        let profile = null;
        let logs = [];
        let progress = [];
        let analytics;
        let training;
        let insights = [];

        if (mongoose.connection.readyState === 1) {
            [profile, logs, progress, training, insights] = await Promise.all([
                UserProfile.findOne({ userId }).lean(),
                DailyLog.find({ userId }).sort({ date: 1 }).limit(45).lean(),
                BodyProgress.find({ userId }).sort({ date: 1 }).limit(12).lean(),
                progressionService.getProgressionSignals(userId),
                CoachingInsight.find({ userId, resolvedAt: null }).sort({ createdAt: -1 }).limit(8).lean()
            ]);

            analytics = await Promise.all([
                analyticsService.calculateRollingAverages(userId, logs),
                analyticsService.calculateAdherenceScore(userId, logs, profile),
                analyticsService.getPredictiveInsights(userId, logs, profile)
            ]);
        } else {
            logs = Array.from({ length: 10 }, (_, index) => ({
                sleepHours: 6.2 + (index % 4) * 0.35,
                energyLevel: 5 + (index % 5),
                recoveryScore: 62 + index,
                waterIntake: 2200 + index * 140,
                didWorkout: index % 2 === 0
            }));
            progress = [
                { date: new Date(Date.now() - 30 * 86400000), weight: 73.5, waistCm: 84 },
                { date: new Date(), weight: 72.1, waistCm: 82 }
            ];
            analytics = [
                { avgCalories7d: 2310, avgProtein7d: 132, workouts7d: 4, avgCalories30d: 2260 },
                { totalScore: 78, breakdown: { calorieAdherence: 82, proteinAdherence: 76, gymAdherence: 75 } },
                { riskOfMissingGoalTomorrow: 34, estimatedWeight30Days: 70.9, streakRisk: 'Low', volatility: 210 }
            ];
            training = {
                sessionCount: 8,
                weeklyFrequency: 4,
                lastSessionVolume: 12400,
                volumeChange: 650,
                trend: 'progressing',
                recentSessions: []
            };
        }

        const nutrition = await nutritionIntelligence.buildSummary(userId, profile, logs);

        const readiness = buildReadinessScore(logs);
        
        // Safeguard analytics destructuring and properties
        const averages = (analytics && analytics[0] && !analytics[0].msg) ? analytics[0] : {
            avgCalories7d: 0,
            avgProtein7d: 0,
            workouts7d: 0,
            avgCalories30d: 0
        };
        const adherence = (analytics && analytics[1]) ? {
            totalScore: analytics[1].totalScore ?? analytics[1].score ?? 0,
            breakdown: analytics[1].breakdown || { calorieAdherence: 0, proteinAdherence: 0, gymAdherence: 0 }
        } : {
            totalScore: 0,
            breakdown: { calorieAdherence: 0, proteinAdherence: 0, gymAdherence: 0 }
        };
        const predictions = (analytics && analytics[2]) ? analytics[2] : {
            riskOfMissingGoalTomorrow: 0,
            estimatedWeight30Days: 0,
            streakRisk: 'Unknown',
            volatility: 0
        };

        return {
            profile,
            readiness,
            analytics: { averages, adherence, predictions },
            nutrition,
            training,
            progress: {
                entries: progress,
                latest: progress[progress.length - 1] || null,
                previous: progress[progress.length - 2] || null
            },
            insights,
            nextBestActions: [
                nutrition.warnings?.[0] ? `Nutrition: ${nutrition.warnings[0]}` : null,
                training.trend === 'dropping' ? 'Training volume is dropping. Reduce fatigue or simplify the next workout.' : null,
                readiness.score < 60 ? `Recovery: ${readiness.drivers.join(', ') || 'readiness is low'}.` : null,
                adherence.totalScore < 70 ? 'Adherence: tighten calories, protein, or gym consistency for the next 7 days.' : null
            ].filter(Boolean).slice(0, 4)
        };
    }
};
