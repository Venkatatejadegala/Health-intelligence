const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const nutritionIntelligence = require('../services/nutritionIntelligence.service');
const { successResponse, errorResponse } = require('../utils/response');

router.get('/summary', protect, async (req, res) => {
    try {
        const summary = await nutritionIntelligence.buildSummary(req.user.id);
        return successResponse(res, summary);
    } catch (error) {
        console.error('Nutrition intelligence error:', error);
        return errorResponse(res, 'Failed to build nutrition intelligence summary', 500, 'NUTRITION_INTELLIGENCE_ERROR');
    }
});

router.post('/calorie-adjustment', protect, async (req, res) => {
    try {
        const summary = await nutritionIntelligence.buildSummary(req.user.id);
        return successResponse(res, summary.adjustment);
    } catch (error) {
        console.error('Calorie adjustment error:', error);
        return errorResponse(res, 'Failed to calculate calorie adjustment', 500, 'CALORIE_ADJUSTMENT_ERROR');
    }
});

router.get('/meal-suggestions', protect, async (req, res) => {
    try {
        const summary = await nutritionIntelligence.buildSummary(req.user.id);
        return successResponse(res, summary.mealIdeas);
    } catch (error) {
        console.error('Meal suggestion error:', error);
        return errorResponse(res, 'Failed to generate meal suggestions', 500, 'MEAL_SUGGESTIONS_ERROR');
    }
});

module.exports = router;
