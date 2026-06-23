const mongoose = require('mongoose');

const userWorkoutSessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    workoutPlanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WorkoutPlan',
        required: true
    },
    date: {
        type: Date,
        required: true,
        index: true
    },
    duration: {
        type: Number,
        default: 0
    },
    workoutName: {
        type: String,
        default: 'Workout Session'
    },
    startTime: {
        type: Date
    },
    endTime: {
        type: Date
    },
    notes: {
        type: String,
        default: ''
    },
    exercises: [{
        name: { type: String, required: true },
        sets: [{
            weight: { type: Number, default: 0 },
            reps: { type: Number, default: 0 },
            completed: { type: Boolean, default: false }
        }]
    }]
}, {
    timestamps: true
});

// Ensure a user logs at most one session per workout plan per day (or just multiple sessions on a date)
userWorkoutSessionSchema.index({ userId: 1, date: 1, workoutPlanId: 1 }, { unique: true });

const UserWorkoutSession = mongoose.model('UserWorkoutSession', userWorkoutSessionSchema);

module.exports = UserWorkoutSession;
