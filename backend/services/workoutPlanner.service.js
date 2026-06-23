const WorkoutPlan = require('../models/WorkoutPlan');
const Exercise = require('../models/Exercise');
const mongoose = require('mongoose');
const localDb = require('./localDb.service');

async function callGeminiAPI(prompt) {
    const rawApiKey = process.env.GEMINI_API_KEY || '';
    const apiKey = rawApiKey.replace(/['"]/g, '').trim();
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is not defined');
    }
    const rawModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const model = rawModel.replace(/['"]/g, '').trim();
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                responseMimeType: 'application/json'
            }
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API returned error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    try {
        const text = data.candidates[0].content.parts[0].text;
        const tokens = data.usageMetadata?.totalTokenCount || Math.ceil((prompt.length + text.length) / 4);
        return { text, tokens };
    } catch (e) {
        throw new Error('Invalid response structure from Gemini API');
    }
}


const templates = {
    squat: {
        name: 'Back Squat',
        targetMuscles: ['quadriceps', 'glutes', 'core'],
        equipment: ['barbell', 'rack'],
        instructions: ['Brace hard before descent.', 'Sit between the hips.', 'Drive up through midfoot.'],
        commonMistakes: ['Knees collapsing inward.', 'Losing brace at the bottom.', 'Cutting depth unintentionally.'],
        beginner: { name: 'Goblet Squat', reps: '10-12' },
        advanced: { name: 'Paused Back Squat', reps: '4-6' }
    },
    hinge: {
        name: 'Romanian Deadlift',
        targetMuscles: ['hamstrings', 'glutes', 'lower back'],
        equipment: ['barbell', 'dumbbells'],
        instructions: ['Push hips back.', 'Keep lats tight.', 'Stop when hamstrings are loaded.'],
        commonMistakes: ['Turning it into a squat.', 'Rounding lower back.', 'Letting the bar drift forward.'],
        beginner: { name: 'Dumbbell Romanian Deadlift', reps: '10-12' },
        advanced: { name: 'Deficit Romanian Deadlift', reps: '6-8' }
    },
    push: {
        name: 'Bench Press',
        targetMuscles: ['chest', 'triceps', 'front delts'],
        equipment: ['barbell', 'bench'],
        instructions: ['Set shoulder blades.', 'Lower with control.', 'Press slightly back toward the rack.'],
        commonMistakes: ['Loose upper back.', 'Bouncing the bar.', 'Flaring elbows too hard.'],
        beginner: { name: 'Push Up', reps: '8-15' },
        advanced: { name: 'Close Grip Bench Press', reps: '5-8' }
    },
    pull: {
        name: 'Lat Pulldown',
        targetMuscles: ['lats', 'biceps', 'upper back'],
        equipment: ['cable'],
        instructions: ['Pull elbows toward ribs.', 'Keep chest tall.', 'Control the return.'],
        commonMistakes: ['Using too much momentum.', 'Pulling behind the neck.', 'Shrugging every rep.'],
        beginner: { name: 'Assisted Pull Up', reps: '8-10' },
        advanced: { name: 'Weighted Pull Up', reps: '4-8' }
    },
    shoulders: {
        name: 'Overhead Press',
        targetMuscles: ['shoulders', 'triceps', 'core'],
        equipment: ['barbell', 'dumbbells'],
        instructions: ['Squeeze glutes.', 'Press in a straight line.', 'Finish with biceps near ears.'],
        commonMistakes: ['Overarching lower back.', 'Pressing around the face.', 'Relaxing core.'],
        beginner: { name: 'Seated Dumbbell Press', reps: '10-12' },
        advanced: { name: 'Push Press', reps: '4-6' }
    },
    arms: {
        name: 'Cable Curl + Rope Pressdown',
        targetMuscles: ['biceps', 'triceps'],
        equipment: ['cable'],
        instructions: ['Use full range.', 'Pause at contraction.', 'Avoid shoulder swing.'],
        commonMistakes: ['Rushing eccentrics.', 'Turning isolation into body English.'],
        beginner: { name: 'Dumbbell Curl + Bench Dip', reps: '10-15' },
        advanced: { name: 'Incline Curl + Overhead Cable Extension', reps: '8-12' }
    }
};

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const getExerciseForLevel = (key, level) => {
    const base = templates[key];
    const variant = level === 'beginner' ? base.beginner : level === 'advanced' ? base.advanced : null;
    return {
        name: variant?.name || base.name,
        targetMuscles: base.targetMuscles,
        instructions: base.instructions,
        commonMistakes: base.commonMistakes,
        sets: level === 'beginner' ? 3 : level === 'advanced' ? 4 : 3,
        reps: variant?.reps || (level === 'advanced' ? '5-8' : '8-12'),
        difficulty: level,
        gifUrl: '',
        mediaStatus: 'gif-api-ready',
        progression: level === 'beginner'
            ? 'Add 1-2 reps per set before increasing load.'
            : 'Add 2.5-5% load when all prescribed reps are completed with stable form.'
    };
};

const splitMap = {
    full_body: [['squat', 'push', 'pull', 'hinge']],
    upper_lower: [['push', 'pull', 'shoulders', 'arms'], ['squat', 'hinge']],
    push_pull_legs: [['push', 'shoulders', 'arms'], ['pull', 'hinge'], ['squat', 'hinge']],
    bro_split: [['push'], ['pull'], ['squat', 'hinge'], ['shoulders', 'arms']]
};

const chooseSplit = (days, requestedSplit) => {
    if (requestedSplit && splitMap[requestedSplit]) return splitMap[requestedSplit];
    if (days <= 3) return splitMap.full_body;
    if (days === 4) return splitMap.upper_lower;
    return splitMap.push_pull_legs;
};

const buildVolumeSummary = (schedule) => {
    const muscles = {};
    schedule.forEach((day) => {
        day.exercises.forEach((exercise) => {
            exercise.targetMuscles.forEach((muscle) => {
                muscles[muscle] = (muscles[muscle] || 0) + exercise.sets;
            });
        });
    });
    return muscles;
};

module.exports = {
    async generatePlan(userId, input) {
        const workoutDays = input.workoutDays?.length ? input.workoutDays.map(Number) : [1, 2, 4, 5];
        const experienceLevel = input.experienceLevel || 'intermediate';
        const goal = input.goal || 'maintenance';
        const split = input.split || (workoutDays.length >= 5 ? 'push_pull_legs' : workoutDays.length === 4 ? 'upper_lower' : 'full_body');
        const name = `${goal} ${split.replaceAll('_', ' ')} plan`;

        // If Gemini API is available, try generating it live!
        if (process.env.GEMINI_API_KEY) {
            try {
                const prompt = `
                You are an elite strength coach and personal trainer.
                Generate a highly personalized workout split plan for a user with:
                - Goal: ${goal}
                - Experience Level: ${experienceLevel}
                - Available Training Days: ${workoutDays.length} days (${workoutDays.map(d => dayNames[d] || `Day ${d}`).join(', ')})
                - Preferred Split style: ${split}
                - Target Equipment: ${JSON.stringify(input.equipment || ['dumbbells', 'barbell', 'cable'])}
                - Focus Areas: ${JSON.stringify(input.bodyFocusAreas || [])}
                
                Respond with ONLY a JSON object that satisfies this exact structure:
                {
                  "weeklySchedule": [
                    {
                      "day": number,
                      "dayName": "string (e.g. Monday)",
                      "focus": "string (e.g. Chest & Triceps)",
                      "estimatedMinutes": number (e.g. 60),
                      "exercises": [
                        {
                          "name": "string (e.g. Barbell Bench Press)",
                          "targetMuscles": ["string"],
                          "instructions": ["string (3 step-by-step form instructions)"],
                          "commonMistakes": ["string (2 common form mistakes)"],
                          "sets": number (e.g. 3),
                          "reps": "string (e.g. 8-12)",
                          "difficulty": "beginner" | "intermediate" | "advanced",
                          "progression": "string (how to progress this exercise)"
                        }
                      ]
                    }
                  ],
                  "progressionRules": ["string"],
                  "recoveryGuidance": ["string"],
                  "muscleBalance": "string"
                }
                `;

                const { text: geminiResponseText, tokens } = await callGeminiAPI(prompt);
                const planData = JSON.parse(geminiResponseText);

                // Log AI usage to database
                try {
                    const aiLogger = require('./aiLogger.service');
                    await aiLogger.logUsage(userId, 'generate-workout-plan', tokens);
                } catch (logErr) {
                    console.error('Failed to log AI usage:', logErr);
                }

                // Save to database if connected
                let plan = { _id: 'demo-plan' };
                const flatExercises = planData.weeklySchedule.flatMap(day =>
                    day.exercises.map(ex => ({
                        ...ex,
                        gifUrl: '',
                        mediaStatus: 'gif-api-ready'
                    }))
                );

                if (mongoose.connection.readyState === 1) {
                    plan = await WorkoutPlan.create({
                        userId,
                        name,
                        goal,
                        experienceLevel,
                        equipment: input.equipment || ['dumbbells', 'barbell', 'cable'],
                        workoutDays,
                        bodyFocusAreas: input.bodyFocusAreas || [],
                        split,
                        exercises: flatExercises,
                        weeklySchedule: planData.weeklySchedule,
                        volumeSummary: buildVolumeSummary(planData.weeklySchedule),
                        progressionRules: planData.progressionRules || [],
                        recoveryGuidance: planData.recoveryGuidance || [],
                        muscleBalance: planData.muscleBalance || '',
                        isCustom: false
                    });
                } else {
                    plan = await localDb.saveWorkoutPlan(userId, {
                        name,
                        goal,
                        experienceLevel,
                        equipment: input.equipment || ['dumbbells', 'barbell', 'cable'],
                        workoutDays,
                        bodyFocusAreas: input.bodyFocusAreas || [],
                        split,
                        exercises: flatExercises,
                        weeklySchedule: planData.weeklySchedule,
                        volumeSummary: buildVolumeSummary(planData.weeklySchedule),
                        progressionRules: planData.progressionRules || [],
                        recoveryGuidance: planData.recoveryGuidance || [],
                        muscleBalance: planData.muscleBalance || '',
                        isCustom: false
                    });
                }

                // Auto-activate plan
                if (mongoose.connection.readyState === 1) {
                    const ActiveWorkoutPlan = require('../models/ActiveWorkoutPlan');
                    await ActiveWorkoutPlan.findOneAndUpdate(
                        { userId },
                        { workoutPlanId: plan._id },
                        { upsert: true, new: true }
                    );
                } else {
                    await localDb.saveActiveWorkoutPlan(userId, plan._id);
                }

                return {
                    planId: plan._id,
                    name,
                    goal,
                    experienceLevel,
                    split,
                    weeklySchedule: planData.weeklySchedule,
                    volumeSummary: buildVolumeSummary(planData.weeklySchedule),
                    progressionRules: planData.progressionRules,
                    recoveryGuidance: planData.recoveryGuidance,
                    muscleBalance: planData.muscleBalance
                };
            } catch (err) {
                console.error('Failed to generate with Gemini, falling back to templates:', err);
            }
        }

        // FALLBACK: Local rules-based template plan
        const splitPattern = chooseSplit(workoutDays.length, split);

        const weeklySchedule = workoutDays.map((dayNumber, index) => {
            const keys = splitPattern[index % splitPattern.length];
            const exercises = keys.map((key) => getExerciseForLevel(key, experienceLevel));
            return {
                day: dayNumber,
                dayName: dayNames[dayNumber] || `Day ${index + 1}`,
                focus: keys.join(' + '),
                estimatedMinutes: goal === 'deficit' ? 55 : 70,
                exercises
            };
        });

        const progressionRules = [
            'Increase load only after all sets hit the top of the rep range with clean form.',
            goal === 'deficit'
                ? 'Keep 1-2 reps in reserve on compounds to protect recovery while dieting.'
                : 'Push one main lift per session closer to failure to drive overload.',
            'Deload if performance drops for two consecutive sessions with poor sleep or recovery.'
        ];
        const recoveryGuidance = [
            'Place rest days after lower-body or high-volume pull sessions when possible.',
            'If sleep is below 6 hours, reduce accessory volume by 20-30% that day.',
            'Track soreness by muscle group so weekly volume can be rebalanced.'
        ];
        const muscleBalance = 'Plan includes knee-dominant, hip-hinge, horizontal/vertical push, pull, shoulders, and arms.';

        const flatExercises = weeklySchedule.flatMap((day) => day.exercises);
        let plan = { _id: 'demo-plan' };
        if (mongoose.connection.readyState === 1) {
            plan = await WorkoutPlan.create({
                userId,
                name,
                goal,
                experienceLevel,
                equipment: input.equipment || ['dumbbells', 'barbell', 'cable'],
                workoutDays,
                bodyFocusAreas: input.bodyFocusAreas || [],
                split,
                exercises: flatExercises,
                weeklySchedule,
                volumeSummary: buildVolumeSummary(weeklySchedule),
                progressionRules,
                recoveryGuidance,
                muscleBalance,
                isCustom: false
            });
        } else {
            plan = await localDb.saveWorkoutPlan(userId, {
                name,
                goal,
                experienceLevel,
                equipment: input.equipment || ['dumbbells', 'barbell', 'cable'],
                workoutDays,
                bodyFocusAreas: input.bodyFocusAreas || [],
                split,
                exercises: flatExercises,
                weeklySchedule,
                volumeSummary: buildVolumeSummary(weeklySchedule),
                progressionRules,
                recoveryGuidance,
                muscleBalance,
                isCustom: false
            });
        }

        // Auto-activate plan
        if (mongoose.connection.readyState === 1) {
            const ActiveWorkoutPlan = require('../models/ActiveWorkoutPlan');
            await ActiveWorkoutPlan.findOneAndUpdate(
                { userId },
                { workoutPlanId: plan._id },
                { upsert: true, new: true }
            );
        } else {
            await localDb.saveActiveWorkoutPlan(userId, plan._id);
        }

        return {
            planId: plan._id,
            name,
            goal,
            experienceLevel,
            split,
            weeklySchedule,
            volumeSummary: buildVolumeSummary(weeklySchedule),
            progressionRules,
            recoveryGuidance,
            muscleBalance
        };
    },

    async getCurrentPlan(userId) {
        let plan;
        if (mongoose.connection.readyState !== 1) {
            plan = await localDb.findWorkoutPlan(userId);
        } else {
            const ActiveWorkoutPlan = require('../models/ActiveWorkoutPlan');
            const activeLink = await ActiveWorkoutPlan.findOne({ userId }).lean();
            if (activeLink) {
                plan = await WorkoutPlan.findById(activeLink.workoutPlanId).lean();
            }
            if (!plan) {
                plan = await WorkoutPlan.findOne({ userId }).sort({ updatedAt: -1 }).lean();
            }
        }

        if (plan && (!plan.weeklySchedule || plan.weeklySchedule.length === 0)) {
            // Backward-compatibility fallback
            const workoutDays = plan.workoutDays || [1, 3, 5];
            plan.weeklySchedule = workoutDays.map((d, index) => ({
                day: d,
                dayName: dayNames[d] || `Day ${index + 1}`,
                focus: plan.split || 'Workout Day',
                estimatedMinutes: 60,
                exercises: plan.exercises || []
            }));
            plan.volumeSummary = plan.volumeSummary || buildVolumeSummary(plan.weeklySchedule);
            plan.progressionRules = plan.progressionRules || ['Follow progressive overload rules.'];
            plan.recoveryGuidance = plan.recoveryGuidance || ['Ensure sufficient rest and sleep.'];
            plan.muscleBalance = plan.muscleBalance || 'Balanced.';
        }
        return plan;
    },

    async enrichExercise(name, options = {}) {
        const normalized = String(name || '').trim();
        if (!normalized) {
            throw new Error('Exercise name is required');
        }

        if (mongoose.connection.readyState === 1) {
            const existing = await Exercise.findOne({
                $or: [
                    { name: new RegExp(`^${normalized}$`, 'i') },
                    { aliases: new RegExp(`^${normalized}$`, 'i') }
                ]
            }).lean();
            if (existing) return { source: 'database', exercise: existing };
        }

        const lower = normalized.toLowerCase();
        const key = lower.includes('squat') ? 'squat'
            : lower.includes('deadlift') || lower.includes('rdl') ? 'hinge'
                : lower.includes('press') || lower.includes('push') || lower.includes('bench') ? 'push'
                    : lower.includes('row') || lower.includes('pull') || lower.includes('lat') ? 'pull'
                        : lower.includes('shoulder') || lower.includes('raise') ? 'shoulders'
                            : 'arms';

        const generated = getExerciseForLevel(key, options.experienceLevel || 'intermediate');
        generated.name = normalized;

        return {
            source: 'rules-enrichment',
            exercise: {
                ...generated,
                primaryMuscles: generated.targetMuscles,
                equipment: options.equipment || templates[key].equipment,
                gifUrl: '',
                instructions: generated.instructions,
                commonMistakes: generated.commonMistakes,
                beginnerVersion: templates[key].beginner.name,
                advancedVersion: templates[key].advanced.name
            },
            nextIntegration: 'Connect ExerciseDB/RapidAPI or a vetted exercise media provider for animated GIF URLs.'
        };
    }
};
