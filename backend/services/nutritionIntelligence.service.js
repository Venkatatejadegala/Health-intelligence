const DailyLog = require('../models/DailyLog');
const UserProfile = require('../models/UserProfile');
const mlClient = require('./mlClient.service');
const mongoose = require('mongoose');
const localDb = require('./localDb.service');

const activityMultipliers = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderate: 1.55,
    very_active: 1.725,
    athlete: 1.9
};

const average = (items, key) => {
    if (!items.length) return 0;
    return items.reduce((sum, item) => sum + (Number(item[key]) || 0), 0) / items.length;
};

const calculateTargets = (profile = {}) => {
    const weight = Number(profile.weight) || 70;
    const height = Number(profile.height) || 172;
    const age = Number(profile.age) || 24;
    const sex = String(profile.sex || 'male').toLowerCase();
    const goal = profile.goal || 'maintenance';
    const activityLevel = profile.activityLevel || 'moderate';

    const bmr = sex === 'female'
        ? (10 * weight) + (6.25 * height) - (5 * age) - 161
        : (10 * weight) + (6.25 * height) - (5 * age) + 5;
    const tdee = bmr * (activityMultipliers[activityLevel] || activityMultipliers.moderate);
    const phaseAdjustment = goal === 'deficit' ? -400 : goal === 'surplus' ? 300 : 0;
    const calories = Math.round(profile.calorieTarget || profile.targetCalories || tdee + phaseAdjustment);
    const protein = Math.round(profile.proteinTarget || profile.targetProtein || weight * (goal === 'deficit' ? 2.1 : 1.8));
    const fat = Math.round(profile.fatsTarget || calories * 0.25 / 9);
    const carbs = Math.round(profile.carbsTarget || (calories - (protein * 4) - (fat * 9)) / 4);

    return {
        bmr: Math.round(profile.bmr || bmr),
        tdee: Math.round(profile.tdee || tdee),
        calories,
        protein,
        carbs: Math.max(carbs, 80),
        fat: Math.max(fat, 35),
        goal,
        weight
    };
};

const analyzeAdherence = (logs, targets) => {
    const recent = logs.slice(-7);
    const avgCalories = Math.round(average(recent, 'caloriesConsumed'));
    const avgProtein = Math.round(average(recent, 'proteinConsumed'));
    const avgSleep = Number(average(recent, 'sleepHours').toFixed(1));
    const avgRecovery = Math.round(average(recent, 'recoveryScore'));
    const workoutDays = recent.filter((log) => log.didWorkout).length;
    const calorieDelta = avgCalories - targets.calories;
    const proteinGap = targets.protein - avgProtein;

    return {
        avgCalories,
        avgProtein,
        avgSleep,
        avgRecovery,
        workoutDays,
        calorieDelta,
        proteinGap,
        calorieAdherence: Math.max(0, Math.round(100 - (Math.abs(calorieDelta) / Math.max(targets.calories, 1)) * 100)),
        proteinAdherence: Math.min(100, Math.round((avgProtein / Math.max(targets.protein, 1)) * 100))
    };
};

const getMealIdeas = (targets, preference = 'indian-budget') => {
    const surplus = targets.goal === 'surplus';
    const deficit = targets.goal === 'deficit';

    return [
        {
            name: 'High protein hostel bowl',
            calories: deficit ? 520 : 720,
            protein: 38,
            items: ['rice or roti portion', 'dal', 'curd', 'eggs/paneer/soya', 'salad'],
            reason: 'Cheap, repeatable, Indian-food friendly, and easy to scale by changing rice/roti quantity.'
        },
        {
            name: surplus ? 'Mass gain shake' : 'Lean recovery snack',
            calories: surplus ? 650 : 280,
            protein: surplus ? 32 : 24,
            items: surplus ? ['milk', 'banana', 'peanut butter', 'whey or curd', 'oats'] : ['curd', 'fruit', 'roasted chana or whey'],
            reason: surplus ? 'Adds calories without forcing another full meal.' : 'Improves protein without breaking the deficit.'
        },
        {
            name: preference === 'vegetarian' ? 'Paneer soya plate' : 'Chicken dal plate',
            calories: 600,
            protein: preference === 'vegetarian' ? 42 : 48,
            items: preference === 'vegetarian' ? ['paneer', 'soya chunks', 'roti', 'vegetables'] : ['chicken', 'dal', 'rice', 'vegetables'],
            reason: 'Covers leucine-rich protein and keeps carbs available for training performance.'
        }
    ];
};

module.exports = {
    calculateTargets,

    async buildSummary(userId, preloadedProfile = null, preloadedLogs = null) {
        let profile = preloadedProfile;
        let logs = preloadedLogs;

        if (!profile || !logs) {
            if (mongoose.connection.readyState === 1) {
                const [dbProfile, dbLogs] = await Promise.all([
                    profile ? null : UserProfile.findOne({ userId }).lean(),
                    logs ? null : DailyLog.find({ userId }).sort({ date: 1 }).limit(45).lean()
                ]);
                if (!profile) profile = dbProfile;
                if (!logs) logs = dbLogs;
            } else {
                if (!profile) profile = await localDb.findProfile(userId);
                if (!logs) {
                    logs = await localDb.findDailyLogs(userId);
                    if (logs && logs.length) {
                        logs.sort((a, b) => new Date(a.date) - new Date(b.date));
                    }
                }
            }
        }

        // If logs is still empty/missing, generate mock logs
        if (!logs || logs.length === 0) {
            logs = Array.from({ length: 10 }, (_, index) => ({
                date: new Date(Date.now() - (9 - index) * 86400000).toISOString(),
                caloriesConsumed: 2200 + (index % 3) * 120,
                proteinConsumed: 120 + (index % 4) * 8,
                sleepHours: 6.4 + (index % 3) * 0.4,
                didWorkout: index % 2 === 0,
                recoveryScore: 68 + index,
                weight: 72 - index * 0.05
            }));
        }

        const targets = calculateTargets(profile || {});
        const adherence = analyzeAdherence(logs, targets);
        const [weightPrediction, plateau, streakBreak] = await Promise.all([
            mlClient.predictWeight(logs, targets),
            mlClient.detectPlateau(logs),
            mlClient.predictStreakBreak(logs)
        ]);

        const warnings = [];
        if (adherence.proteinGap > 20) warnings.push(`Protein is averaging ${adherence.proteinGap}g below target.`);
        if (adherence.avgSleep && adherence.avgSleep < 6.5) warnings.push('Sleep is likely limiting recovery and appetite control.');
        if (adherence.calorieDelta > 250 && targets.goal === 'deficit') warnings.push('Calorie intake is drifting above the deficit target.');
        if (adherence.calorieDelta < -300 && targets.goal === 'surplus') warnings.push('Calorie intake is too low for a reliable surplus.');
        if (plateau.plateau) warnings.push('Plateau signal detected from recent weight entries.');

        const adjustment = this.recommendCalorieAdjustment(targets, adherence, plateau);

        return {
            profile: profile || null,
            targets,
            adherence,
            predictions: {
                weightPrediction,
                plateau,
                streakBreak
            },
            adjustment,
            mealIdeas: getMealIdeas(targets),
            warnings,
            dataQuality: {
                logCount: logs.length,
                weightEntries: logs.filter((log) => typeof log.weight === 'number').length,
                status: logs.length >= 14 ? 'strong' : logs.length >= 5 ? 'developing' : 'needs-more-logs'
            }
        };
    },

    recommendCalorieAdjustment(targets, adherence, plateau) {
        let change = 0;
        let reason = 'Hold calories steady while collecting more consistent data.';

        if (targets.goal === 'deficit' && plateau.plateau && adherence.calorieAdherence >= 75) {
            change = -100;
            reason = 'Plateau detected with decent adherence, so use a small deficit increase.';
        } else if (targets.goal === 'surplus' && adherence.calorieDelta < -150) {
            change = 150;
            reason = 'Surplus intake is under target, so add calories before changing training.';
        } else if (targets.goal === 'deficit' && adherence.calorieDelta > 250) {
            change = 0;
            reason = 'Do not cut calories yet; first improve actual adherence to the current target.';
        } else if (adherence.avgSleep && adherence.avgSleep < 6.5) {
            change = 0;
            reason = 'Recovery is the blocker; improve sleep before making calorie changes.';
        }

        return {
            currentCalories: targets.calories,
            recommendedCalories: targets.calories + change,
            change,
            reason
        };
    }
};
