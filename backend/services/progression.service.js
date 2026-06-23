const UserWorkoutSession = require('../models/UserWorkoutSession');
const localDb = require('./localDb.service');
const mongoose = require('mongoose');

const calculateSessionVolume = (session) => {
    return (session.exercises || []).reduce((total, exercise) => {
        const exerciseVolume = (exercise.sets || []).reduce((sum, set) => {
            return sum + ((Number(set.weight) || 0) * (Number(set.reps) || 0));
        }, 0);
        return total + exerciseVolume;
    }, 0);
};

const summarizeExercisePerformance = (session) => {
    return (session.exercises || []).map((exercise) => {
        const completedSets = (exercise.sets || []).filter((set) => set.completed);
        const topSet = completedSets.reduce((best, set) => {
            const score = (Number(set.weight) || 0) * (Number(set.reps) || 0);
            const bestScore = (Number(best.weight) || 0) * (Number(best.reps) || 0);
            return score > bestScore ? set : best;
        }, completedSets[0] || {});

        return {
            name: exercise.name,
            completedSets: completedSets.length,
            totalReps: completedSets.reduce((sum, set) => sum + (Number(set.reps) || 0), 0),
            volume: completedSets.reduce((sum, set) => sum + ((Number(set.weight) || 0) * (Number(set.reps) || 0)), 0),
            topSet
        };
    });
};

module.exports = {
    calculateSessionVolume,
    summarizeExercisePerformance,

    async getProgressionSignals(userId, days = 45) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        startDate.setHours(0, 0, 0, 0);

        let sessions = [];
        if (mongoose.connection.readyState === 1) {
            sessions = await UserWorkoutSession.find({
                userId,
                date: { $gte: startDate }
            }).sort({ date: 1 }).lean();
        } else {
            sessions = await localDb.findSessions(userId);
            sessions = sessions.filter(s => new Date(s.date) >= startDate);
            sessions.sort((a, b) => new Date(a.date) - new Date(b.date));
        }

        const volumes = sessions.map((session) => ({
            date: session.date,
            volume: calculateSessionVolume(session),
            exercises: summarizeExercisePerformance(session)
        }));

        const last = volumes[volumes.length - 1];
        const previous = volumes[volumes.length - 2];
        const volumeChange = last && previous ? last.volume - previous.volume : 0;

        return {
            sessionCount: sessions.length,
            weeklyFrequency: Number((sessions.length / Math.max(days / 7, 1)).toFixed(1)),
            lastSessionVolume: last?.volume || 0,
            volumeChange,
            trend: volumeChange > 500 ? 'progressing' : volumeChange < -500 ? 'dropping' : 'stable',
            recentSessions: volumes.slice(-6)
        };
    }
};
