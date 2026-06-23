const mongoose = require('mongoose');

const activeWorkoutPlanSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },
    workoutPlanId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WorkoutPlan',
        required: true
    }
}, {
    timestamps: true
});

const ActiveWorkoutPlan = mongoose.model('ActiveWorkoutPlan', activeWorkoutPlanSchema);

module.exports = ActiveWorkoutPlan;
