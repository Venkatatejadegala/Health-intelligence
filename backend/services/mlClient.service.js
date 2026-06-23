const DEFAULT_ML_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

const postToMl = async (path, body, timeoutMs = 2500) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(`${DEFAULT_ML_URL}${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: controller.signal
        });

        if (!response.ok) {
            throw new Error(`ML service returned ${response.status}`);
        }

        return await response.json();
    } finally {
        clearTimeout(timer);
    }
};

const localWeightPrediction = (logs, currentWeight = 70, calorieTarget = 2200) => {
    const cleanLogs = logs.filter((log) => typeof log.caloriesConsumed === 'number');
    if (cleanLogs.length < 3) {
        return {
            source: 'local-statistical-fallback',
            predictedWeight30Days: currentWeight,
            trend: 'insufficient-data',
            confidence: 0.35
        };
    }

    const avgDelta = cleanLogs.reduce((sum, log) => sum + ((log.caloriesConsumed || 0) - calorieTarget), 0) / cleanLogs.length;
    const expectedChange = (avgDelta * 30) / 7700;

    return {
        source: 'local-statistical-fallback',
        predictedWeight30Days: Number((currentWeight + expectedChange).toFixed(1)),
        trend: avgDelta < -150 ? 'losing' : avgDelta > 150 ? 'gaining' : 'stable',
        confidence: Math.min(0.85, 0.45 + cleanLogs.length / 80)
    };
};

const detectPlateau = (logs) => {
    const weights = logs
        .filter((log) => typeof log.weight === 'number')
        .slice(-14)
        .map((log) => log.weight);

    if (weights.length < 7) {
        return { source: 'local-statistical-fallback', plateau: false, reason: 'Need at least 7 weight entries.' };
    }

    const change = weights[weights.length - 1] - weights[0];
    return {
        source: 'local-statistical-fallback',
        plateau: Math.abs(change) < 0.25,
        weightChangeKg: Number(change.toFixed(2)),
        reason: Math.abs(change) < 0.25
            ? 'Weight has stayed within a narrow band for the last logged period.'
            : 'Weight trend is still moving.'
    };
};

const predictStreakBreak = (logs) => {
    const recent = logs.slice(-10);
    const missedRecent = recent.filter((log) => !log.didWorkout).length;
    const lowSleep = recent.filter((log) => (log.sleepHours || 0) < 6).length;
    const lowEnergy = recent.filter((log) => (log.energyLevel || 5) <= 4).length;
    const risk = Math.min(95, Math.round((missedRecent * 9) + (lowSleep * 7) + (lowEnergy * 6)));

    return {
        source: 'local-statistical-fallback',
        riskPercent: risk,
        riskLevel: risk >= 65 ? 'high' : risk >= 35 ? 'medium' : 'low',
        drivers: [
            missedRecent >= 3 ? 'recent missed workouts' : null,
            lowSleep >= 3 ? 'sleep debt' : null,
            lowEnergy >= 3 ? 'low energy trend' : null
        ].filter(Boolean)
    };
};

module.exports = {
    async predictWeight(logs, profile) {
        try {
            return await postToMl('/predict-weight', {
                logs,
                currentWeight: profile?.weight || 70,
                calorieTarget: profile?.calorieTarget || profile?.targetCalories || 2200
            });
        } catch (error) {
            return localWeightPrediction(logs, profile?.weight || 70, profile?.calorieTarget || profile?.targetCalories || 2200);
        }
    },

    async detectPlateau(logs) {
        try {
            return await postToMl('/detect-plateau', { logs });
        } catch (error) {
            return detectPlateau(logs);
        }
    },

    async predictStreakBreak(logs) {
        try {
            return await postToMl('/predict-streak-break', { logs });
        } catch (error) {
            return predictStreakBreak(logs);
        }
    }
};
