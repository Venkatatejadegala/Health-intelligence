const mongoose = require('mongoose');

const bodyProgressSchema = new mongoose.Schema({
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
    weight: { type: Number, default: null },
    bodyFatPercent: { type: Number, default: null },
    waistCm: { type: Number, default: null },
    chestCm: { type: Number, default: null },
    armsCm: { type: Number, default: null },
    thighsCm: { type: Number, default: null },
    progressPhotoUrl: { type: String, default: '' },
    postureNotes: { type: String, default: '' },
    coachNotes: { type: String, default: '' }
}, { timestamps: true });

bodyProgressSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('BodyProgress', bodyProgressSchema);
