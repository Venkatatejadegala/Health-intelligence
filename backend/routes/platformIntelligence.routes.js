const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const platformIntelligence = require('../services/platformIntelligence.service');
const mongoose = require('mongoose');
const DailyLog = require('../models/DailyLog');
const UserWorkoutSession = require('../models/UserWorkoutSession');
const WorkoutPlan = require('../models/WorkoutPlan');
const UserProfile = require('../models/UserProfile');
const localDb = require('../services/localDb.service');
const fs = require('fs');
const path = require('path');
const { successResponse, errorResponse } = require('../utils/response');

router.get('/overview', protect, async (req, res) => {
    try {
        const overview = await platformIntelligence.buildOverview(req.user.id);
        return successResponse(res, overview);
    } catch (error) {
        console.error('Platform overview error:', error);
        return errorResponse(res, 'Failed to build intelligence overview', 500, 'PLATFORM_OVERVIEW_ERROR');
    }
});

router.post('/seed', protect, async (req, res) => {
    try {
        const userId = req.user.id;
        console.log(`Seeding requested for user: ${userId}`);

        // Generate 30 days of historical data
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        const dailyLogs = [];
        const sessions = [];
        let currentWeight = 76.5;

        for (let i = 0; i <= 30; i++) {
            const logDate = new Date(startDate);
            logDate.setDate(startDate.getDate() + i);
            logDate.setHours(12, 0, 0, 0);

            const isWeekend = logDate.getDay() === 0 || logDate.getDay() === 6;
            const didWorkout = !isWeekend && (i % 2 === 0);
            
            const calorieTarget = 2000;
            const caloriesConsumed = Math.round(calorieTarget + (Math.sin(i) * 150) + (isWeekend ? 200 : -100));
            const proteinConsumed = Math.round(150 + (Math.cos(i) * 10));
            const carbsConsumed = Math.round(180 + (Math.sin(i) * 20));
            const fatConsumed = Math.round(60 + (isWeekend ? 10 : -5));
            
            const sleepHours = Number((7.0 + Math.sin(i/2) * 0.8 + (isWeekend ? 1.0 : 0)).toFixed(1));
            const stressLevel = didWorkout ? Math.round(4 - Math.sin(i)) : Math.round(5 + Math.sin(i));
            const energyLevel = sleepHours > 7 ? Math.round(8 - stressLevel/3) : Math.round(6 - stressLevel/3);
            const recoveryScore = Math.min(100, Math.max(30, Math.round(sleepHours * 10 + (10 - stressLevel) * 2 + (didWorkout ? -10 : 10))));

            const weightLossPerDay = ((2500 - caloriesConsumed) / 7700);
            currentWeight -= weightLossPerDay;

            const meals = [
                {
                    id: `meal_b_${i}`,
                    name: 'Oatmeal with protein shake and banana',
                    calories: 550,
                    protein: 38,
                    carbs: 65,
                    fat: 10,
                    fiber: 8,
                    serving: '1 bowl',
                    confidence: 98,
                    mealType: 'breakfast'
                },
                {
                    id: `meal_l_${i}`,
                    name: 'Grilled chicken breast with white rice & cucumber salad',
                    calories: 680,
                    protein: 50,
                    carbs: 75,
                    fat: 12,
                    fiber: 6,
                    serving: '1 plate',
                    confidence: 95,
                    mealType: 'lunch'
                }
            ];

            dailyLogs.push({
                userId,
                date: logDate.toISOString(),
                caloriesConsumed,
                proteinConsumed,
                carbsConsumed,
                fatConsumed,
                fiberConsumed: 22,
                waterIntake: didWorkout ? 3200 : 2200,
                sleepHours,
                didWorkout,
                energyLevel,
                stressLevel,
                mood: Math.max(1, Math.min(5, Math.round(energyLevel / 2))),
                recoveryScore,
                weight: Number(currentWeight.toFixed(2)),
                meals,
                createdAt: logDate.toISOString(),
                updatedAt: logDate.toISOString()
            });

            if (didWorkout) {
                sessions.push({
                    userId,
                    workoutPlanId: new mongoose.Types.ObjectId('665000000000000000000005'),
                    date: logDate.toISOString(),
                    exercises: [
                        {
                            name: 'Back Squat',
                            sets: [
                                { weight: 80, reps: 8, completed: true },
                                { weight: 80, reps: 8, completed: true },
                                { weight: 85, reps: 6, completed: true }
                            ]
                        },
                        {
                            name: 'Bench Press',
                            sets: [
                                { weight: 70, reps: 8, completed: true },
                                { weight: 70, reps: 8, completed: true },
                                { weight: 72.5, reps: 7, completed: true }
                            ]
                        }
                    ],
                    createdAt: logDate.toISOString(),
                    updatedAt: logDate.toISOString()
                });
            }
        }

        const profileFields = {
            userId,
            age: 26,
            sex: 'male',
            height: 180,
            weight: 76.5,
            activityLevel: 'moderately_active',
            goal: 'deficit',
            bmr: 1762,
            tdee: 2731,
            calorieTarget: 2000,
            proteinTarget: 150,
            carbsTarget: 200,
            fatsTarget: 66
        };

        const workoutPlanFields = {
            userId,
            name: 'deficit upper lower plan',
            goal: 'deficit',
            experienceLevel: 'intermediate',
            equipment: ['barbell', 'dumbbells', 'bench', 'cable'],
            workoutDays: [1, 2, 4, 5],
            bodyFocusAreas: ['chest', 'back', 'legs'],
            split: 'upper_lower',
            exercises: [
                {
                    name: 'Back Squat',
                    targetMuscles: ['quadriceps', 'glutes', 'core'],
                    instructions: ['Brace hard before descent.', 'Sit between the hips.', 'Drive up through midfoot.'],
                    commonMistakes: ['Knees collapsing inward.', 'Losing brace at the bottom.'],
                    sets: 3,
                    reps: '8-12',
                    difficulty: 'intermediate',
                    gifUrl: '',
                    mediaStatus: 'gif-api-ready'
                },
                {
                    name: 'Bench Press',
                    targetMuscles: ['chest', 'triceps', 'front delts'],
                    instructions: ['Set shoulder blades.', 'Lower with control.', 'Press slightly back.'],
                    commonMistakes: ['Loose upper back.', 'Bouncing the bar.'],
                    sets: 3,
                    reps: '8-12',
                    difficulty: 'intermediate',
                    gifUrl: '',
                    mediaStatus: 'gif-api-ready'
                }
            ],
            isCustom: false
        };

        if (mongoose.connection.readyState === 1) {
            // MongoDB
            await DailyLog.deleteMany({ userId });
            await UserWorkoutSession.deleteMany({ userId });
            await UserProfile.deleteMany({ userId });
            await WorkoutPlan.deleteMany({ userId });

            await DailyLog.insertMany(dailyLogs);
            await UserWorkoutSession.insertMany(sessions);
            await UserProfile.create(profileFields);
            
            // Assign real generated ids
            const plan = new WorkoutPlan({
                ...workoutPlanFields,
                _id: new mongoose.Types.ObjectId('665000000000000000000005')
            });
            await plan.save();
        } else {
            // Fallback DB
            const db = JSON.parse(fs.readFileSync(path.join(__dirname, '../local_db.json'), 'utf8'));
            if (!db.dailyLogs) db.dailyLogs = [];
            if (!db.sessions) db.sessions = [];
            if (!db.profiles) db.profiles = [];
            if (!db.workoutPlans) db.workoutPlans = [];
            if (!db.users) db.users = [];
            
            // Filter out existing for this user
            db.dailyLogs = db.dailyLogs.filter(log => log.userId !== userId);
            db.sessions = db.sessions.filter(sess => sess.userId !== userId);
            db.profiles = db.profiles.filter(prof => prof.userId !== userId);
            db.workoutPlans = db.workoutPlans.filter(plan => plan.userId !== userId);

            // Add generated
            dailyLogs.forEach(l => l._id = 'mock_log_' + Math.random().toString(36).substr(2, 9));
            sessions.forEach(s => s._id = 'mock_sess_' + Math.random().toString(36).substr(2, 9));
            
            db.dailyLogs.push(...dailyLogs);
            db.sessions.push(...sessions);
            
            const mockProfile = {
                ...profileFields,
                updatedAt: new Date().toISOString(),
                createdAt: new Date().toISOString()
            };
            db.profiles.push(mockProfile);

            const mockPlan = {
                ...workoutPlanFields,
                _id: '665000000000000000000005',
                updatedAt: new Date().toISOString(),
                createdAt: new Date().toISOString()
            };
            db.workoutPlans.push(mockPlan);

            fs.writeFileSync(path.join(__dirname, '../local_db.json'), JSON.stringify(db, null, 2));
        }

        return successResponse(res, { message: 'High-fidelity demo metrics and workout history successfully seeded!' });
    } catch (error) {
        console.error('Platform seeding error:', error);
        return errorResponse(res, 'Failed to seed user intelligence data', 500, 'PLATFORM_SEEDING_ERROR');
    }
});

module.exports = router;
