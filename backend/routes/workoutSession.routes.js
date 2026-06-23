const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const UserWorkoutSession = require('../models/UserWorkoutSession');
const progressionService = require('../services/progression.service');
const localDb = require('../services/localDb.service');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { successResponse, errorResponse } = require('../utils/response');

const normalizeDate = (dateValue) => {
    const date = dateValue ? new Date(dateValue) : new Date();
    date.setHours(0, 0, 0, 0);
    return date;
};

router.get('/', protect, async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 30;
        const skip = (page - 1) * limit;

        let sessions = [];
        let pagination = {};

        if (mongoose.connection.readyState === 1) {
            const total = await UserWorkoutSession.countDocuments({ userId });
            sessions = await UserWorkoutSession.find({ userId })
                .sort({ date: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            pagination = {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            };
        } else {
            sessions = await localDb.findSessions(userId);
            sessions.sort((a, b) => new Date(b.date) - new Date(a.date));
            const total = sessions.length;
            sessions = sessions.slice(skip, skip + limit);
            pagination = {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            };
        }
        return successResponse(res, sessions, 200, { pagination });
    } catch (error) {
        console.error('Workout session list error:', error);
        return errorResponse(res, 'Failed to load workout sessions', 500, 'WORKOUT_SESSION_LIST_ERROR');
    }
});

router.post('/', protect, async (req, res) => {
    try {
        let session;
        const targetDate = normalizeDate(req.body?.date);
        const startTime = req.body?.startTime ? new Date(req.body.startTime) : null;
        const endTime = req.body?.endTime ? new Date(req.body.endTime) : null;
        const notes = req.body?.notes || '';

        if (mongoose.connection.readyState === 1) {
            session = await UserWorkoutSession.findOneAndUpdate(
                {
                    userId: req.user.id,
                    date: targetDate,
                    workoutPlanId: req.body?.workoutPlanId
                },
                {
                    $set: {
                        userId: req.user.id,
                        workoutPlanId: req.body?.workoutPlanId,
                        workoutName: req.body?.workoutName || 'Workout Session',
                        date: targetDate,
                        exercises: req.body?.exercises || [],
                        duration: Number(req.body?.duration) || 0,
                        startTime,
                        endTime,
                        notes
                    }
                },
                { upsert: true, new: true, runValidators: true }
            );

            // Side effect: update DailyLog didWorkout to true
            const DailyLog = require('../models/DailyLog');
            await DailyLog.findOneAndUpdate(
                { userId: req.user.id, date: targetDate },
                { $set: { didWorkout: true } },
                { upsert: true }
            );
        } else {
            // Check if existing mock session and overwrite or create
            const sessions = await localDb.findSessions(req.user.id);
            const formattedTargetDate = targetDate.toISOString().split('T')[0];
            const existingIndex = sessions.findIndex(s => 
                s.workoutPlanId === req.body?.workoutPlanId && 
                new Date(s.date).toISOString().split('T')[0] === formattedTargetDate
            );

            const sessionData = {
                workoutPlanId: req.body?.workoutPlanId,
                workoutName: req.body?.workoutName || 'Workout Session',
                date: targetDate.toISOString(),
                exercises: req.body?.exercises || [],
                duration: Number(req.body?.duration) || 0,
                startTime: startTime ? startTime.toISOString() : null,
                endTime: endTime ? endTime.toISOString() : null,
                notes
            };

            if (existingIndex > -1) {
                // Modify existing
                const db = JSON.parse(fs.readFileSync(path.join(__dirname, '../local_db.json'), 'utf8'));
                db.sessions = db.sessions.filter(s => s._id !== sessions[existingIndex]._id);
                
                session = {
                    ...sessions[existingIndex],
                    ...sessionData,
                    updatedAt: new Date().toISOString()
                };
                db.sessions.push(session);
                fs.writeFileSync(path.join(__dirname, '../local_db.json'), JSON.stringify(db, null, 2));
            } else {
                session = await localDb.saveSession(req.user.id, sessionData);
            }

            // Side effect: update local daily log didWorkout
            let existingLog = await localDb.findDailyLog(req.user.id, targetDate);
            if (!existingLog) {
                existingLog = {
                    date: targetDate.toISOString(),
                    userId: req.user.id,
                    caloriesConsumed: 0,
                    proteinConsumed: 0,
                    carbsConsumed: 0,
                    fatConsumed: 0,
                    fiberConsumed: 0,
                    meals: []
                };
            }
            existingLog.didWorkout = true;
            await localDb.saveDailyLog(req.user.id, existingLog);
        }

        return successResponse(res, {
            session,
            volume: progressionService.calculateSessionVolume(session),
            exercises: progressionService.summarizeExercisePerformance(session)
        }, 201);
    } catch (error) {
        console.error('Workout session save error:', error);
        return errorResponse(res, 'Failed to save workout session', 500, 'WORKOUT_SESSION_SAVE_ERROR');
    }
});

router.get('/progression', protect, async (req, res) => {
    try {
        const data = await progressionService.getProgressionSignals(req.user.id);
        return successResponse(res, data);
    } catch (error) {
        console.error('Progression signal error:', error);
        return errorResponse(res, 'Failed to load progression signals', 500, 'PROGRESSION_SIGNAL_ERROR');
    }
});

module.exports = router;
