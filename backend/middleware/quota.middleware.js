const AiUsage = require('../models/AiUsage');
const mongoose = require('mongoose');

/**
 * Middleware to restrict users who exceed their daily token limit (50,000 tokens per 24 hours).
 */
const checkAiQuota = async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    // Database connection is offline, skip limit checks
    return next();
  }

  try {
    const userId = req.user.id;
    const timeLimit = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

    // Aggregate token sum in the last 24 hours
    const usageList = await AiUsage.find({
      userId,
      createdAt: { $gte: timeLimit }
    }).select('tokens');

    const totalTokens = usageList.reduce((sum, item) => sum + (item.tokens || 0), 0);

    const LIMIT_TOKENS_DAILY = 50000;

    if (totalTokens > LIMIT_TOKENS_DAILY) {
      return res.status(429).json({
        success: false,
        error: 'You have reached your daily AI allowance (50,000 tokens). Please try again tomorrow.',
        code: 'AI_QUOTA_EXCEEDED',
        details: {
          limit: LIMIT_TOKENS_DAILY,
          current: totalTokens
        }
      });
    }

    // Append current usage metrics to request metadata
    req.aiTokenUsage24h = totalTokens;
    next();
  } catch (error) {
    console.error('Error running AI quota checks:', error);
    next(); // Fail open so the user is not locked out due to monitoring failure
  }
};

module.exports = { checkAiQuota };
