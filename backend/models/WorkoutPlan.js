const mongoose = require('mongoose');

const workoutPlanSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true
    },
    goal: {
        type: String,
        enum: ['deficit', 'surplus', 'maintenance'],
        required: true
    },
    experienceLevel: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'intermediate'
    },
    equipment: {
        type: [String],
        default: []
    },
    workoutDays: {
        type: [Number], // 0 for Sunday, 1 for Monday, etc.
        default: []
    },
    bodyFocusAreas: {
        type: [String],
        default: []
    },
    split: {
        type: String,
        default: 'custom'
    },
    exercises: [{
        name: { type: String, required: true },
        targetMuscles: { type: [String], default: [] },
        instructions: { type: [String], default: [] },
        commonMistakes: { type: [String], default: [] },
        sets: { type: Number, default: 3 },
        reps: { type: String, default: '8-12' },
        gifUrl: { type: String, default: '' },
        difficulty: { type: String, default: 'medium' }
    }],
    weeklySchedule: [{
        day: { type: Number },
        dayName: { type: String },
        focus: { type: String },
        estimatedMinutes: { type: Number },
        exercises: [{
            name: { type: String, required: true },
            targetMuscles: { type: [String], default: [] },
            instructions: { type: [String], default: [] },
            commonMistakes: { type: [String], default: [] },
            sets: { type: Number, default: 3 },
            reps: { type: String, default: '8-12' },
            difficulty: { type: String, default: 'medium' },
            progression: { type: String, default: '' }
        }]
    }],
    volumeSummary: {
        type: Map,
        of: Number,
        default: {}
    },
    progressionRules: {
        type: [String],
        default: []
    },
    recoveryGuidance: {
        type: [String],
        default: []
    },
    muscleBalance: {
        type: String,
        default: ''
    },
    isCustom: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const WorkoutPlan = mongoose.model('WorkoutPlan', workoutPlanSchema);

module.exports = WorkoutPlan;
