const DailyLog = require('../models/DailyLog');
const UserProfile = require('../models/UserProfile');
const UserWorkoutSession = require('../models/UserWorkoutSession');

/**
 * Service to handle ML and statistical calculations for the Smart Consistency Engine.
 */
class AnalyticsService {

    /**
     * Get logs for a user over a specific day range.
     */
    async getLogs(userId, daysBack = 30, preloadedLogs = null) {
        if (preloadedLogs) {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - daysBack);
            startDate.setHours(0, 0, 0, 0);
            return preloadedLogs
                .filter(log => new Date(log.date) >= startDate)
                .sort((a, b) => new Date(a.date) - new Date(b.date));
        }

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - daysBack);
        startDate.setHours(0, 0, 0, 0);

        return await DailyLog.find({
            userId,
            date: { $gte: startDate }
        }).sort({ date: 1 });
    }

    /**
     * Calculate current logging/active day streak
     */
    async calculateStreak(userId) {
        const mongoose = require('mongoose');
        const localDb = require('./localDb.service');
        let logs = [];
        let sessions = [];
        if (mongoose.connection.readyState === 1) {
            logs = await DailyLog.find({ userId }).sort({ date: -1 });
            sessions = await UserWorkoutSession.find({ userId }).sort({ date: -1 });
        } else {
            logs = await localDb.findDailyLogs(userId);
            logs.sort((a, b) => new Date(b.date) - new Date(a.date));
            sessions = await localDb.findSessions(userId);
            sessions.sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        const uniqueDates = new Set();
        logs.forEach(l => uniqueDates.add(new Date(l.date).toISOString().split('T')[0]));
        sessions.forEach(s => uniqueDates.add(new Date(s.date).toISOString().split('T')[0]));

        if (uniqueDates.size === 0) return 0;

        let streak = 0;
        const todayStr = new Date().toISOString().split('T')[0];
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        let currentCheck = new Date();
        if (uniqueDates.has(todayStr)) {
            currentCheck = new Date();
        } else if (uniqueDates.has(yesterdayStr)) {
            currentCheck = yesterday;
        } else {
            return 0;
        }

        while (true) {
            const checkStr = currentCheck.toISOString().split('T')[0];
            if (uniqueDates.has(checkStr)) {
                streak++;
                currentCheck.setDate(currentCheck.getDate() - 1);
            } else {
                break;
            }
        }

        return streak;
    }

    /**
     * Calculate 7-day and 30-day rolling averages for keys.
     */
    async calculateRollingAverages(userId, preloadedLogs = null) {
        const logs = await this.getLogs(userId, 30, preloadedLogs);
        const mongoose = require('mongoose');
        const localDb = require('./localDb.service');

        let totalWorkouts = 0;
        if (mongoose.connection.readyState === 1) {
            totalWorkouts = await UserWorkoutSession.countDocuments({ userId });
        } else {
            totalWorkouts = (await localDb.findSessions(userId)).length;
        }

        const streak = await this.calculateStreak(userId);

        if (logs.length === 0) {
            return {
                msg: "Not enough data",
                streak,
                totalWorkouts,
                avgCalories7d: 0,
                avgProtein7d: 0,
                workouts7d: 0,
                avgCalories30d: 0
            };
        }

        const last7Logs = logs.slice(-7);

        const sumCals7 = last7Logs.reduce((sum, log) => sum + (log.caloriesConsumed || 0), 0);
        const sumPro7 = last7Logs.reduce((sum, log) => sum + (log.proteinConsumed || 0), 0);
        const workouts7 = last7Logs.filter(l => l.didWorkout).length;

        const sumCals30 = logs.reduce((sum, log) => sum + (log.caloriesConsumed || 0), 0);

        return {
            avgCalories7d: Math.round(sumCals7 / (last7Logs.length || 1)),
            avgProtein7d: Math.round(sumPro7 / (last7Logs.length || 1)),
            workouts7d: workouts7,
            avgCalories30d: Math.round(sumCals30 / (logs.length || 1)),
            streak,
            totalWorkouts
        };
    }

    /**
     * Calculate user adherence score based on calories, protein, and gym workouts.
     */
    async calculateAdherenceScore(userId, preloadedLogs = null, preloadedProfile = null) {
        const logs = await this.getLogs(userId, 30, preloadedLogs);
        
        let profile = preloadedProfile;
        if (!profile) {
            const mongoose = require('mongoose');
            const localDb = require('./localDb.service');
            if (mongoose.connection.readyState === 1) {
                profile = await UserProfile.findOne({ userId });
            } else {
                profile = await localDb.findProfile(userId);
            }
        }

        const targetCals = (profile && profile.calorieTarget) || 2000;
        const targetPro = (profile && profile.proteinTarget) || 150;

        if (logs.length === 0) {
            return {
                totalScore: 0,
                breakdown: { calorieAdherence: 0, proteinAdherence: 0, gymAdherence: 0 }
            };
        }

        const mongoose = require('mongoose');
        const localDb = require('./localDb.service');
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);

        let gymSessions = [];
        if (mongoose.connection.readyState === 1) {
            gymSessions = await UserWorkoutSession.find({
                userId,
                date: { $gte: startDate }
            });
        } else {
            gymSessions = await localDb.findSessions(userId);
            gymSessions = gymSessions.filter(s => new Date(s.date) >= startDate);
        }

        const gymDates = new Set(gymSessions.map(s => new Date(s.date).toISOString().split('T')[0]));
        const gymDays = gymDates.size;

        // Calorie Adherence: % of days where calories are within 15% of target
        let calorieAdherentDays = 0;
        // Protein Adherence: % of days where protein is at least 85% of target
        let proteinAdherentDays = 0;

        logs.forEach(log => {
            const cals = log.caloriesConsumed || 0;
            const pro = log.proteinConsumed || 0;
            
            // within 15% target
            const calDiff = Math.abs(cals - targetCals) / targetCals;
            if (calDiff <= 0.15) {
                calorieAdherentDays++;
            }
            
            // at least 85% target
            if (pro >= (targetPro * 0.85)) {
                proteinAdherentDays++;
            }
        });

        const calorieAdherence = Math.round((calorieAdherentDays / logs.length) * 100);
        const proteinAdherence = Math.round((proteinAdherentDays / logs.length) * 100);
        
        // Assume target gym frequency is 4 days a week (~17 days in 30 days)
        // If they did 17 workouts, gymAdherence is 100%. Otherwise, proportional.
        const targetGymDays = Math.round((logs.length / 7) * 4); // ~17 days for a 30-day logs array
        const gymAdherence = Math.min(100, Math.round((gymDays / Math.max(1, targetGymDays)) * 100));

        const totalScore = Math.round((calorieAdherence + proteinAdherence + gymAdherence) / 3);

        return {
            totalScore,
            breakdown: {
                calorieAdherence,
                proteinAdherence,
                gymAdherence
            }
        };
    }

    /**
     * Get predictive insights using statistical logic.
     */
    async getPredictiveInsights(userId, preloadedLogs = null, preloadedProfile = null) {
        const logs = await this.getLogs(userId, 30, preloadedLogs);
        
        let profile = preloadedProfile;
        if (!profile) {
            const mongoose = require('mongoose');
            const localDb = require('./localDb.service');
            if (mongoose.connection.readyState === 1) {
                profile = await UserProfile.findOne({ userId });
            } else {
                profile = await localDb.findProfile(userId);
            }
        }

        const targetCals = (profile && profile.calorieTarget) || 2000;
        const currentWeight = (profile && profile.weight) || 75;

        if (logs.length === 0) {
            return {
                riskOfMissingGoalTomorrow: 0,
                estimatedWeight30Days: currentWeight,
                streakRisk: 'No activity yet',
                volatility: 0
            };
        }

        // Calculate daily deviation
        const deviations = logs.map(l => (l.caloriesConsumed || 0) - targetCals);

        // Calculate Standard Deviation
        const meanDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;
        const squaredDiffs = deviations.map(d => Math.pow(d - meanDeviation, 2));
        const stdDev = Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length);

        // Risk calculation logic (Simple statistical heuristic)
        let riskOfMissingTomorrow = 50; // Base 50%
        if (meanDeviation > 300) riskOfMissingTomorrow += 20; // Consistently overeating
        if (stdDev > 500) riskOfMissingTomorrow += 20; // High volatility = high risk
        if (deviations.slice(-3).every(d => d > 200)) riskOfMissingTomorrow += 25; // Last 3 days were bad

        // Clamp
        riskOfMissingTomorrow = Math.min(Math.max(riskOfMissingTomorrow, 5), 95);

        // Weight Prediction (Thermodynamics: 7700 kcal = 1kg)
        const averageDailyDeficit = -meanDeviation; // if deviation is positive, deficit is negative

        // Expected weight change in 30 days
        const expectedWeightChangeKg = (averageDailyDeficit * 30) / 7700;
        const estimatedWeight30Days = currentWeight - expectedWeightChangeKg;

        // Gym Streak Risk
        const last7Workouts = logs.slice(-7).filter(l => l.didWorkout).length;
        let streakRisk = 'Low';
        if (last7Workouts === 0) streakRisk = 'High (No recent activity)';
        else if (last7Workouts < 3) streakRisk = 'Medium';

        return {
            riskOfMissingGoalTomorrow: Math.round(riskOfMissingTomorrow),
            estimatedWeight30Days: Number(estimatedWeight30Days.toFixed(1)),
            streakRisk,
            volatility: Math.round(stdDev)
        };
    }
}

module.exports = new AnalyticsService();
