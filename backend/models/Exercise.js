const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, index: true },
    aliases: { type: [String], default: [] },
    primaryMuscles: { type: [String], default: [] },
    secondaryMuscles: { type: [String], default: [] },
    equipment: { type: [String], default: [] },
    movementPattern: { type: String, default: 'compound' },
    difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'intermediate'
    },
    instructions: { type: [String], default: [] },
    commonMistakes: { type: [String], default: [] },
    sets: { type: Number, default: 3 },
    reps: { type: String, default: '8-12' },
    gifUrl: { type: String, default: '' },
    source: { type: String, default: 'system' },
    progressions: { type: [String], default: [] },
    regressions: { type: [String], default: [] }
}, { timestamps: true });

exerciseSchema.index({ name: 'text', aliases: 'text', primaryMuscles: 'text' });

module.exports = mongoose.model('Exercise', exerciseSchema);
