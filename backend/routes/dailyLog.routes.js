const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const DailyLog = require('../models/DailyLog');
const mongoose = require('mongoose');
const localDb = require('../services/localDb.service.js');
const { validateBody } = require('../middleware/validation.middleware');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');

const normalizeDate = (dateValue) => {
    const date = dateValue ? new Date(dateValue) : new Date();
    date.setHours(0, 0, 0, 0);
    return date;
};

/**
 * @swagger
 * /api/logs:
 *   get:
 *     summary: Retrieve daily logs
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of days of logs to retrieve
 *     responses:
 *       200:
 *         description: A list of daily logs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DailyLog'
 *       500:
 *         description: Failed to load logs
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorEnvelope'
 */
router.get('/', protect, async (req, res) => {
    try {
        if (mongoose.connection.readyState === 1) {
            const days = Number(req.query.days) || 30;
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            startDate.setHours(0, 0, 0, 0);

            const logs = await DailyLog.find({
                userId: req.user.id,
                date: { $gte: startDate }
            }).sort({ date: 1 });

            return successResponse(res, logs);
        } else {
            if ((process.env.NODE_ENV || 'development') === 'production') {
                throw new Error('Database connection is not ready');
            }
            const logs = await localDb.findDailyLogs(req.user.id);
            return successResponse(res, logs);
        }
    } catch (error) {
        logger.error({ err: error.message, userId: req.user.id }, 'Daily log list error');
        return errorResponse(res, 'Failed to load daily logs', 500, 'DAILY_LOG_LIST_ERROR');
    }
});

/**
 * @swagger
 * /api/logs/today:
 *   get:
 *     summary: Get log for today or a specific date
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Date of the log to fetch (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: The daily log
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/DailyLog'
 *       500:
 *         description: Failed to fetch log
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorEnvelope'
 */
router.get('/today', protect, async (req, res) => {
    try {
        const date = normalizeDate(req.query?.date);
        if (mongoose.connection.readyState === 1) {
            const log = await DailyLog.findOne({ userId: req.user.id, date });
            return successResponse(res, log);
        } else {
            if ((process.env.NODE_ENV || 'development') === 'production') {
                throw new Error('Database connection is not ready');
            }
            const log = await localDb.findDailyLog(req.user.id, date);
            return successResponse(res, log);
        }
    } catch (error) {
        logger.error({ err: error.message, userId: req.user.id }, 'Daily log fetch today error');
        return errorResponse(res, 'Failed to load daily log', 500, 'DAILY_LOG_FETCH_ERROR');
    }
});

/**
 * @swagger
 * /api/logs/today:
 *   put:
 *     summary: Update daily log
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               caloriesConsumed: { type: integer }
 *               waterIntake: { type: integer }
 *               sleepHours: { type: number }
 *               workoutDuration: { type: integer }
 *               activeCaloriesBurned: { type: integer }
 *     responses:
 *       200:
 *         description: Updated daily log
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/DailyLog'
 *       500:
 *         description: Failed to update log
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorEnvelope'
 */
router.put('/today', protect, validateBody({ date: 'string' }), async (req, res) => {
    try {
        const date = normalizeDate(req.body?.date);
        const update = { ...req.body, userId: req.user.id, date };

        if (mongoose.connection.readyState === 1) {
            const log = await DailyLog.findOneAndUpdate(
                { userId: req.user.id, date },
                { $set: update },
                { upsert: true, new: true, runValidators: true }
            );

            return successResponse(res, log);
        } else {
            if ((process.env.NODE_ENV || 'development') === 'production') {
                throw new Error('Database connection is not ready');
            }
            const log = await localDb.saveDailyLog(req.user.id, update);
            return successResponse(res, log);
        }
    } catch (error) {
        logger.error({ err: error.message, userId: req.user.id }, 'Daily log update error');
        return errorResponse(res, 'Failed to update daily log', 500, 'DAILY_LOG_UPDATE_ERROR');
    }
});

/**
 * @swagger
 * /api/logs/meal:
 *   post:
 *     summary: Log a meal
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - name
 *               - calories
 *               - protein
 *             properties:
 *               date: { type: string, format: date }
 *               name: { type: string }
 *               calories: { type: number }
 *               protein: { type: number }
 *               carbs: { type: number }
 *               fat: { type: number }
 *               fiber: { type: number }
 *     responses:
 *       201:
 *         description: Meal logged successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   $ref: '#/components/schemas/DailyLog'
 *       500:
 *         description: Failed to add meal
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorEnvelope'
 */
router.post('/meal', protect, validateBody({ date: 'string', name: 'string', calories: 'number', protein: 'number' }), async (req, res) => {
    try {
        const date = normalizeDate(req.body?.date);
        const meal = {
            id: req.body?.id || `${Date.now()}`,
            name: req.body?.name || 'Meal',
            calories: Number(req.body?.calories) || 0,
            protein: Number(req.body?.protein) || 0,
            carbs: Number(req.body?.carbs) || 0,
            fat: Number(req.body?.fat) || 0,
            fiber: Number(req.body?.fiber) || 0,
            serving: req.body?.serving || '',
            confidence: Number(req.body?.confidence) || 80,
            mealType: req.body?.mealType || 'meal'
        };

        if (mongoose.connection.readyState === 1) {
            const log = await DailyLog.findOneAndUpdate(
                { userId: req.user.id, date },
                {
                    $setOnInsert: { userId: req.user.id, date },
                    $inc: {
                        caloriesConsumed: meal.calories,
                        proteinConsumed: meal.protein,
                        carbsConsumed: meal.carbs,
                        fatConsumed: meal.fat,
                        fiberConsumed: meal.fiber
                    },
                    $push: { meals: meal }
                },
                { upsert: true, new: true, runValidators: true }
            );

            return successResponse(res, log, 201);
        } else {
            if ((process.env.NODE_ENV || 'development') === 'production') {
                throw new Error('Database connection is not ready');
            }
            let existingLog = await localDb.findDailyLog(req.user.id, date);
            if (!existingLog) {
                existingLog = {
                    date,
                    userId: req.user.id,
                    caloriesConsumed: 0,
                    proteinConsumed: 0,
                    carbsConsumed: 0,
                    fatConsumed: 0,
                    fiberConsumed: 0,
                    meals: []
                };
            }
            existingLog.caloriesConsumed = (existingLog.caloriesConsumed || 0) + meal.calories;
            existingLog.proteinConsumed = (existingLog.proteinConsumed || 0) + meal.protein;
            existingLog.carbsConsumed = (existingLog.carbsConsumed || 0) + meal.carbs;
            existingLog.fatConsumed = (existingLog.fatConsumed || 0) + meal.fat;
            existingLog.fiberConsumed = (existingLog.fiberConsumed || 0) + meal.fiber;
            
            if (!existingLog.meals) existingLog.meals = [];
            existingLog.meals.push(meal);

            const log = await localDb.saveDailyLog(req.user.id, existingLog);
            return successResponse(res, log, 201);
        }
    } catch (error) {
        logger.error({ err: error.message, userId: req.user.id }, 'Meal log error');
        return errorResponse(res, 'Failed to add meal', 500, 'MEAL_LOG_ERROR');
    }
});

module.exports = router;
