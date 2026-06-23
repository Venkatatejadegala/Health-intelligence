const mongoose = require('mongoose');

const aiUsageSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    endpoint: {
        type: String,
        required: true
    },
    tokens: {
        type: Number,
        required: true
    }
}, { timestamps: true });

// Add index on userId and createdAt to make aggregate queries fast
aiUsageSchema.index({ userId: 1, createdAt: -1 });

const AiUsage = mongoose.model('AiUsage', aiUsageSchema);
module.exports = AiUsage;
