const express = require('express');
const router = express.Router();
const { protect, requireEmailVerified } = require('../middleware/auth.middleware');
const aiCoachService = require('../services/aiCoach.service');
const CoachingInsight = require('../models/CoachingInsight');
const localDb = require('../services/localDb.service');
const mongoose = require('mongoose');
const { successResponse, errorResponse } = require('../utils/response');

const { checkAiQuota } = require('../middleware/quota.middleware');

router.post('/insight', protect, requireEmailVerified, checkAiQuota, async (req, res) => {
  try {
    const userId = req.user.id;
    const { question, persona } = req.body || {};
    const result = await aiCoachService.generateCoachInsight(userId, question, persona);

    return successResponse(res, result);
  } catch (error) {
    console.error('AI coach insight error:', error);
    return errorResponse(res, 'Failed to generate AI coaching insight', 500, 'COACH_INSIGHT_ERROR');
  }
});

router.get('/insights-history', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    let history = [];
    let pagination = {};

    if (mongoose.connection.readyState === 1) {
      const total = await CoachingInsight.countDocuments({ userId });
      history = await CoachingInsight.find({ userId })
        .sort({ createdAt: -1 })
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
      history = await localDb.findCoachingInsights(userId);
      // Sort descending
      history.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
      const total = history.length;
      history = history.slice(skip, skip + limit);
      pagination = {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      };
    }
    return successResponse(res, history, 200, { pagination });
  } catch (error) {
    console.error('AI coach history error:', error);
    return errorResponse(res, 'Failed to load coaching insights history', 500, 'COACH_HISTORY_ERROR');
  }
});

router.get('/context', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const context = await aiCoachService.buildUserContext(userId);

    return successResponse(res, context);
  } catch (error) {
    console.error('AI coach context error:', error);
    return errorResponse(res, 'Failed to build AI coaching context', 500, 'COACH_CONTEXT_ERROR');
  }
});

module.exports = router;
