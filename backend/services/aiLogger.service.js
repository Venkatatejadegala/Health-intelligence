const AiUsage = require('../models/AiUsage');
const mongoose = require('mongoose');

/**
 * Log token usage for a user.
 * 
 * @param {string} userId - User identifier
 * @param {string} endpoint - API route or feature name
 * @param {number} tokens - Estimated or returned tokens consumed
 * @returns {Promise<void>}
 */
const logUsage = async (userId, endpoint, tokens) => {
  if (!userId || !endpoint || !tokens) return;
  if (mongoose.connection.readyState !== 1) return;

  try {
    await AiUsage.create({
      userId,
      endpoint,
      tokens: Number(tokens)
    });
  } catch (error) {
    console.error('Failed to log AI usage to database:', error);
  }
};

module.exports = { logUsage };
