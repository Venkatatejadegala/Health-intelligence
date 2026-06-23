const mongoose = require('mongoose');

const coachingInsightSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    date: {
        type: Date,
        default: Date.now,
        index: true
    },
    persona: {
        type: String,
        required: true,
        default: 'scientific'
    },
    question: {
        type: String,
        default: ''
    },
    insight: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    contextHash: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

coachingInsightSchema.index({ userId: 1, contextHash: 1 });

const CoachingInsight = mongoose.model('CoachingInsight', coachingInsightSchema);

module.exports = CoachingInsight;
