const mongoose = require('mongoose');

const dailyLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    date: {
        type: Date,
        required: true,
        index: true
    },
    caloriesConsumed: {
        type: Number,
        default: 0
    },
    proteinConsumed: {
        type: Number,
        default: 0
    },
    fatConsumed: {
        type: Number,
        default: 0
    },
    carbsConsumed: {
        type: Number,
        default: 0
    },
    fiberConsumed: {
        type: Number,
        default: 0
    },
    waterIntake: {
        type: Number, // in ml
        default: 0
    },
    didWorkout: {
        type: Boolean,
        default: false
    },
    sleepHours: {
        type: Number,
        default: 0
    },
    stressLevel: {
        type: Number, // e.g., 1-10
        default: 5
    },
    energyLevel: {
        type: Number, // e.g., 1-10
        default: 5
    },
    mood: {
        type: Number, // 1-5
        default: 3
    },
    recoveryScore: {
        type: Number, // 0-100
        default: 70
    },
    weight: {
        type: Number // to track daily weight changes
    },
    habits: [{
        habitId: String,
        name: String,
        completed: { type: Boolean, default: false }
    }],
    meals: [{
        id: String,
        name: String,
        calories: Number,
        protein: Number,
        carbs: Number,
        fat: Number,
        fiber: Number,
        serving: String,
        confidence: Number,
        mealType: String,
        timestamp: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true
});

// Ensure only one log per user per day
dailyLogSchema.index({ userId: 1, date: 1 }, { unique: true });

const DailyLog = mongoose.model('DailyLog', dailyLogSchema);

module.exports = DailyLog;
