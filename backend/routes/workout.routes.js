const express = require('express');
const router = express.Router();
const { protect, requireEmailVerified } = require('../middleware/auth.middleware');
const workoutPlanner = require('../services/workoutPlanner.service');
const { validateBody } = require('../middleware/validation.middleware');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * @swagger
 * /api/workouts/generate-plan:
 *   post:
 *     summary: Generate a personalized workout plan
 *     tags: [Workouts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - workoutDays
 *               - experienceLevel
 *               - goal
 *             properties:
 *               workoutDays:
 *                 type: array
 *                 items: { type: string }
 *                 example: ["Monday", "Wednesday", "Friday"]
 *               experienceLevel:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *                 example: intermediate
 *               goal:
 *                 type: string
 *                 enum: [strength, hypertrophy, endurance, general_fitness]
 *                 example: hypertrophy
 *     responses:
 *       201:
 *         description: Workout plan generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/WorkoutPlan'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorEnvelope'
 */
const { checkAiQuota } = require('../middleware/quota.middleware');

router.post('/generate-plan', protect, requireEmailVerified, checkAiQuota, validateBody({ workoutDays: 'array', experienceLevel: 'string', goal: 'string' }), async (req, res) => {
    try {
        const plan = await workoutPlanner.generatePlan(req.user.id, req.body || {});
        return successResponse(res, plan, 201);
    } catch (error) {
        logger.error({ err: error.message, userId: req.user.id }, 'Workout generation error');
        return errorResponse(res, 'Failed to generate workout plan', 500, 'WORKOUT_GENERATION_ERROR');
    }
});

/**
 * @swagger
 * /api/workouts/current:
 *   get:
 *     summary: Get current active workout plan
 *     tags: [Workouts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current active plan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/WorkoutPlan'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorEnvelope'
 */
router.get('/current', protect, async (req, res) => {
    try {
        const plan = await workoutPlanner.getCurrentPlan(req.user.id);
        return successResponse(res, plan);
    } catch (error) {
        logger.error({ err: error.message, userId: req.user.id }, 'Current workout error');
        return errorResponse(res, 'Failed to load workout plan', 500, 'WORKOUT_LOAD_ERROR');
    }
});

/**
 * @swagger
 * /api/workouts/enrich-exercise:
 *   post:
 *     summary: Enrich an exercise with video demonstration and tips
 *     tags: [Workouts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Bench Press
 *     responses:
 *       200:
 *         description: Enriched exercise instructions and media assets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *       450:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorEnvelope'
 */
router.post('/enrich-exercise', protect, requireEmailVerified, checkAiQuota, validateBody({ name: 'string' }), async (req, res) => {
    try {
        const enriched = await workoutPlanner.enrichExercise(req.body?.name, req.body || {});
        return successResponse(res, enriched);
    } catch (error) {
        logger.error({ err: error.message, exerciseName: req.body?.name }, 'Exercise enrichment error');
        return errorResponse(res, error.message || 'Failed to enrich exercise', 400, 'EXERCISE_ENRICH_ERROR');
    }
});

const mongoose = require('mongoose');
const localDb = require('../services/localDb.service');

// GET /api/workouts/
// List all saved plans for the user
router.get('/', protect, async (req, res) => {
    try {
        const userId = req.user.id;
        let plans = [];
        if (mongoose.connection.readyState === 1) {
            const WorkoutPlan = require('../models/WorkoutPlan');
            plans = await WorkoutPlan.find({ userId }).sort({ updatedAt: -1 }).lean();
        } else {
            plans = await localDb.findAllWorkoutPlans(userId);
        }
        return successResponse(res, plans);
    } catch (error) {
        logger.error({ err: error.message, userId: req.user.id }, 'Workout list error');
        return errorResponse(res, 'Failed to list workout plans', 500, 'WORKOUT_LIST_ERROR');
    }
});

// GET /api/workouts/active
// Get the current active plan details
router.get('/active', protect, async (req, res) => {
    try {
        const userId = req.user.id;
        let plan = null;
        if (mongoose.connection.readyState === 1) {
            const ActiveWorkoutPlan = require('../models/ActiveWorkoutPlan');
            const WorkoutPlan = require('../models/WorkoutPlan');
            const activeLink = await ActiveWorkoutPlan.findOne({ userId }).lean();
            if (activeLink) {
                plan = await WorkoutPlan.findById(activeLink.workoutPlanId).lean();
            }
        } else {
            plan = await localDb.findActiveWorkoutPlan(userId);
        }
        if (!plan) {
            // Fallback to current (latest) plan
            plan = await workoutPlanner.getCurrentPlan(userId);
        }
        return successResponse(res, plan);
    } catch (error) {
        logger.error({ err: error.message, userId: req.user.id }, 'Active workout fetch error');
        return errorResponse(res, 'Failed to fetch active workout plan', 500, 'ACTIVE_WORKOUT_ERROR');
    }
});

// POST /api/workouts/custom
// Create a new custom workout plan
router.post('/custom', protect, async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, goal, experienceLevel, split, workoutDays, bodyFocusAreas, equipment, weeklySchedule } = req.body;
        
        const buildVolumeSummary = (schedule) => {
            const muscles = {};
            (schedule || []).forEach((day) => {
                (day.exercises || []).forEach((exercise) => {
                    (exercise.targetMuscles || []).forEach((muscle) => {
                        muscles[muscle] = (muscles[muscle] || 0) + (Number(exercise.sets) || 3);
                    });
                });
            });
            return muscles;
        };

        const volumeSummary = buildVolumeSummary(weeklySchedule);

        let plan;
        const planData = {
            userId,
            name: name || 'Custom Workout Plan',
            goal: goal || 'maintenance',
            experienceLevel: experienceLevel || 'intermediate',
            split: split || 'custom',
            workoutDays: workoutDays || [],
            bodyFocusAreas: bodyFocusAreas || [],
            equipment: equipment || [],
            exercises: (weeklySchedule || []).flatMap(day => day.exercises || []),
            weeklySchedule: weeklySchedule || [],
            volumeSummary,
            progressionRules: req.body.progressionRules || [
                'Increase reps or weight systematically every week.',
                'Ensure form remains solid throughout all sets.'
            ],
            recoveryGuidance: req.body.recoveryGuidance || [
                'Get 7-8 hours of sleep per night.',
                'Rest at least 48 hours before retraining the same muscle group.'
            ],
            muscleBalance: req.body.muscleBalance || 'Balanced customization.',
            isCustom: true
        };

        if (mongoose.connection.readyState === 1) {
            const WorkoutPlan = require('../models/WorkoutPlan');
            plan = await WorkoutPlan.create(planData);
            
            // Auto-activate custom plan
            const ActiveWorkoutPlan = require('../models/ActiveWorkoutPlan');
            await ActiveWorkoutPlan.findOneAndUpdate(
                { userId },
                { workoutPlanId: plan._id },
                { upsert: true, new: true }
            );
        } else {
            plan = await localDb.saveWorkoutPlan(userId, planData);
            await localDb.saveActiveWorkoutPlan(userId, plan._id);
        }

        return successResponse(res, plan, 201);
    } catch (error) {
        logger.error({ err: error.message, userId: req.user.id }, 'Custom workout creation error');
        return errorResponse(res, 'Failed to create custom workout plan', 500, 'CUSTOM_WORKOUT_CREATE_ERROR');
    }
});

// POST /api/workouts/:id/activate
// Set a specific plan as active
router.post('/:id/activate', protect, async (req, res) => {
    try {
        const userId = req.user.id;
        const planId = req.params.id;
        
        let planExists = false;
        if (mongoose.connection.readyState === 1) {
            const WorkoutPlan = require('../models/WorkoutPlan');
            const p = await WorkoutPlan.findOne({ _id: planId, userId });
            if (p) planExists = true;
        } else {
            const p = await localDb.findWorkoutPlanById(planId);
            if (p && p.userId === userId) planExists = true;
        }

        if (!planExists) {
            return errorResponse(res, 'Workout plan not found', 404, 'WORKOUT_PLAN_NOT_FOUND');
        }

        if (mongoose.connection.readyState === 1) {
            const ActiveWorkoutPlan = require('../models/ActiveWorkoutPlan');
            await ActiveWorkoutPlan.findOneAndUpdate(
                { userId },
                { workoutPlanId: planId },
                { upsert: true, new: true }
            );
        } else {
            await localDb.saveActiveWorkoutPlan(userId, planId);
        }

        return successResponse(res, { activated: true });
    } catch (error) {
        logger.error({ err: error.message, userId: req.user.id, planId: req.params.id }, 'Activate workout plan error');
        return errorResponse(res, 'Failed to activate workout plan', 500, 'WORKOUT_ACTIVATE_ERROR');
    }
});

// DELETE /api/workouts/:id
// Delete a saved workout plan
router.delete('/:id', protect, async (req, res) => {
    try {
        const userId = req.user.id;
        const planId = req.params.id;

        if (mongoose.connection.readyState === 1) {
            const WorkoutPlan = require('../models/WorkoutPlan');
            const result = await WorkoutPlan.deleteOne({ _id: planId, userId });
            if (result.deletedCount === 0) {
                return errorResponse(res, 'Workout plan not found', 404, 'WORKOUT_PLAN_NOT_FOUND');
            }
            const ActiveWorkoutPlan = require('../models/ActiveWorkoutPlan');
            await ActiveWorkoutPlan.deleteOne({ userId, workoutPlanId: planId });
        } else {
            await localDb.deleteWorkoutPlan(planId);
        }

        return successResponse(res, { deleted: true });
    } catch (error) {
        logger.error({ err: error.message, userId: req.user.id, planId: req.params.id }, 'Delete workout plan error');
        return errorResponse(res, 'Failed to delete workout plan', 500, 'WORKOUT_DELETE_ERROR');
    }
});

// GET /api/workouts/dashboard-stats
// Retrieve live stats calculated dynamically from actual workout sessions
router.get('/dashboard-stats', protect, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // 1. Fetch Active/Current Plan
        let plan = null;
        if (mongoose.connection.readyState === 1) {
            const ActiveWorkoutPlan = require('../models/ActiveWorkoutPlan');
            const WorkoutPlan = require('../models/WorkoutPlan');
            const activeLink = await ActiveWorkoutPlan.findOne({ userId }).lean();
            if (activeLink) {
                plan = await WorkoutPlan.findById(activeLink.workoutPlanId).lean();
            }
        } else {
            plan = await localDb.findActiveWorkoutPlan(userId);
        }
        if (!plan) {
            plan = await workoutPlanner.getCurrentPlan(userId);
        }

        // 2. Fetch User Workout Sessions
        let sessions = [];
        if (mongoose.connection.readyState === 1) {
            const UserWorkoutSession = require('../models/UserWorkoutSession');
            sessions = await UserWorkoutSession.find({ userId }).sort({ date: -1 }).lean();
        } else {
            sessions = await localDb.findSessions(userId);
            sessions.sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        // 3. Determine Today's Scheduled Workout
        let todayWorkout = null;
        if (plan && plan.weeklySchedule) {
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const todayName = dayNames[new Date().getDay()];
            todayWorkout = plan.weeklySchedule.find(
                d => d.dayName === todayName || d.day === new Date().getDay()
            ) || null;
        }

        // 4. Calculate Streak (only based on workout sessions!)
        const sessionDates = new Set(sessions.map(s => new Date(s.date).toISOString().split('T')[0]));
        let streak = 0;
        if (sessionDates.size > 0) {
            const todayStr = new Date().toISOString().split('T')[0];
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            let checkDate = null;
            if (sessionDates.has(todayStr)) {
                checkDate = new Date();
            } else if (sessionDates.has(yesterdayStr)) {
                checkDate = yesterday;
            }

            if (checkDate) {
                while (true) {
                    const checkStr = checkDate.toISOString().split('T')[0];
                    if (sessionDates.has(checkStr)) {
                        streak++;
                        checkDate.setDate(checkDate.getDate() - 1);
                    } else {
                        break;
                    }
                }
            }
        }

        // 5. Calculate Consistency % over last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentSessions = sessions.filter(s => new Date(s.date) >= thirtyDaysAgo);
        
        let daysPerWeek = 3;
        if (plan) {
            if (plan.workoutDays && plan.workoutDays.length > 0) {
                daysPerWeek = plan.workoutDays.length;
            } else if (plan.weeklySchedule && plan.weeklySchedule.length > 0) {
                daysPerWeek = plan.weeklySchedule.length;
            }
        }
        const targetWorkouts = (30 / 7) * daysPerWeek;
        const consistency = targetWorkouts > 0 
            ? Math.min(100, Math.round((recentSessions.length / targetWorkouts) * 100))
            : 0;

        // 6. Find Last Workout Details
        let lastWorkout = null;
        if (sessions.length > 0) {
            const lastSession = sessions[0];
            // calculate volume
            let totalVolume = 0;
            (lastSession.exercises || []).forEach(ex => {
                (ex.sets || []).forEach(s => {
                    if (s.completed !== false) {
                        totalVolume += (Number(s.weight) || 0) * (Number(s.reps) || 0);
                    }
                });
            });
            lastWorkout = {
                date: lastSession.date,
                workoutName: lastSession.workoutName,
                duration: lastSession.duration || 0,
                volume: totalVolume
            };
        }

        // 7. Calculate Weekly Volume (Sunday to Saturday)
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())); // Sunday
        startOfWeek.setHours(0, 0, 0, 0);
        
        const thisWeekSessions = sessions.filter(s => new Date(s.date) >= startOfWeek);
        let weeklyVolume = 0;
        thisWeekSessions.forEach(session => {
            (session.exercises || []).forEach(ex => {
                (ex.sets || []).forEach(s => {
                    if (s.completed !== false) {
                        weeklyVolume += (Number(s.weight) || 0) * (Number(s.reps) || 0);
                    }
                });
            });
        });

        return successResponse(res, {
            activePlanName: plan ? plan.name : 'No Active Plan',
            activePlanGoal: plan ? plan.goal : '',
            todayWorkout,
            streak,
            consistency,
            lastWorkout,
            weeklyVolume
        });

    } catch (error) {
        logger.error({ err: error.message, userId: req.user.id }, 'Dashboard stats compilation error');
        return errorResponse(res, 'Failed to fetch dashboard metrics', 500, 'DASHBOARD_STATS_ERROR');
    }
});

module.exports = router;
