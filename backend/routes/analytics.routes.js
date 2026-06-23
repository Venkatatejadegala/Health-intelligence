const express = require('express');
const router = express.Router();
const analyticsService = require('../services/analytics.service');
const { protect } = require('../middleware/auth.middleware');
const { successResponse, errorResponse } = require('../utils/response');

// GET /api/analytics/consistency
// Requires auth token
router.get('/consistency', protect, async (req, res) => {
    try {
        const userId = req.user.id;

        // Run calculations concurrently
        const [averages, adherence, predictions] = await Promise.all([
            analyticsService.calculateRollingAverages(userId),
            analyticsService.calculateAdherenceScore(userId),
            analyticsService.getPredictiveInsights(userId)
        ]);

        return successResponse(res, {
            averages,
            adherence,
            predictions
        });

    } catch (error) {
        console.error('Analytics Error:', error);
        return errorResponse(res, 'Failed to generate analytics insights', 500, 'ANALYTICS_ERROR');
    }
});

module.exports = router;
