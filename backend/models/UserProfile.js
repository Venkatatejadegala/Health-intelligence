const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },
    name: { type: String, default: null },
    age: { type: Number, default: null },
    sex: { type: String, default: null },
    height: { type: Number, default: null },
    weight: { type: Number, default: null },
    activityLevel: { type: String, default: null },
    goal: { type: String, default: null },
    bmr: { type: Number, default: null },
    tdee: { type: Number, default: null },
    calorieTarget: { type: Number, default: null },
    proteinTarget: { type: Number, default: null },
    carbsTarget: { type: Number, default: null },
    fatsTarget: { type: Number, default: null },
    profileImage: { type: String, default: null },
}, { timestamps: true });

const UserProfile = mongoose.model('UserProfile', userProfileSchema);
module.exports = UserProfile;
