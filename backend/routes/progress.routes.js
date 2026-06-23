const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const BodyProgress = require('../models/BodyProgress');
const { successResponse, errorResponse } = require('../utils/response');

const normalizeDate = (dateValue) => {
    const date = dateValue ? new Date(dateValue) : new Date();
    date.setHours(0, 0, 0, 0);
    return date;
};

router.get('/', protect, async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 60;
        const skip = (page - 1) * limit;

        let entries = [];
        let pagination = {};

        if (mongoose.connection.readyState === 1) {
            const total = await BodyProgress.countDocuments({ userId });
            entries = await BodyProgress.find({ userId })
                .sort({ date: 1 })
                .skip(skip)
                .limit(limit)
                .lean();

            pagination = {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            };
        } else {
            const total = await BodyProgress.countDocuments({ userId });
            entries = await BodyProgress.find({ userId })
                .sort({ date: 1 })
                .skip(skip)
                .limit(limit)
                .lean();

            pagination = {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            };
        }
        return successResponse(res, entries, 200, { pagination });
    } catch (error) {
        console.error('Progress list error:', error);
        return errorResponse(res, 'Failed to load body progress', 500, 'PROGRESS_LIST_ERROR');
    }
});

router.put('/entry', protect, async (req, res) => {
    try {
        const date = normalizeDate(req.body?.date);
        const entry = await BodyProgress.findOneAndUpdate(
            { userId: req.user.id, date },
            { $set: { ...req.body, userId: req.user.id, date } },
            { upsert: true, new: true, runValidators: true }
        );

        return successResponse(res, entry);
    } catch (error) {
        console.error('Progress entry error:', error);
        return errorResponse(res, 'Failed to save progress entry', 500, 'PROGRESS_ENTRY_ERROR');
    }
});

router.get('/comparison', protect, async (req, res) => {
    try {
        const entries = await BodyProgress.find({ userId: req.user.id }).sort({ date: 1 }).limit(60).lean();
        const first = entries[0] || null;
        const latest = entries[entries.length - 1] || null;

        return successResponse(res, {
            first,
            latest,
            deltas: first && latest ? {
                weight: latest.weight != null && first.weight != null ? Number((latest.weight - first.weight).toFixed(1)) : null,
                waistCm: latest.waistCm != null && first.waistCm != null ? Number((latest.waistCm - first.waistCm).toFixed(1)) : null,
                bodyFatPercent: latest.bodyFatPercent != null && first.bodyFatPercent != null ? Number((latest.bodyFatPercent - first.bodyFatPercent).toFixed(1)) : null
            } : {}
        });
    } catch (error) {
        console.error('Progress comparison error:', error);
        return errorResponse(res, 'Failed to compare progress', 500, 'PROGRESS_COMPARISON_ERROR');
    }
});

module.exports = router;
