const express = require('express');
const router = express.Router();
const User = require('../models/User');
const AiUsage = require('../models/AiUsage');
const { protect, isAdmin } = require('../middleware/auth.middleware');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');
const mongoose = require('mongoose');
const localDb = require('../services/localDb.service');

// Get all users (paginated, with search filters)
router.get('/users', protect, isAdmin, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const search = req.query.search ? req.query.search.trim() : '';

  if (mongoose.connection.readyState !== 1) {
    const localUsers = await localDb.getUsers();
    const filtered = localUsers.filter(u => 
      !search || 
      u.username.toLowerCase().includes(search.toLowerCase()) || 
      u.email.toLowerCase().includes(search.toLowerCase())
    );
    const paginated = filtered.slice(skip, skip + limit);
    return successResponse(res, {
      users: paginated.map(u => ({
        _id: u._id,
        username: u.username,
        email: u.email,
        role: u.role || 'user',
        isSuspended: u.isSuspended || false,
        createdAt: u.createdAt
      })),
      totalPages: Math.ceil(filtered.length / limit),
      totalCount: filtered.length,
      currentPage: page
    }, 200);
  }

  try {
    const query = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const totalCount = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return successResponse(res, {
      users,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      currentPage: page
    }, 200);
  } catch (error) {
    logger.error({ err: error.message }, 'Admin error fetching users');
    return errorResponse(res, 'Error fetching users', 500, 'ADMIN_FETCH_USERS_ERROR');
  }
});

// Toggle user suspension
router.post('/users/:id/suspend', protect, isAdmin, async (req, res) => {
  const { id } = req.params;

  if (mongoose.connection.readyState !== 1) {
     const user = await localDb.findUserById(id);
     if (!user) {
       return errorResponse(res, 'User not found.', 404, 'USER_NOT_FOUND');
     }
     if (user._id.toString() === req.user.id) {
       return errorResponse(res, 'You cannot suspend your own admin account.', 400, 'SELF_SUSPENSION_BLOCKED');
     }
     user.isSuspended = !user.isSuspended;
     await localDb.updateUser(id, { isSuspended: user.isSuspended });
     return successResponse(res, { message: `User account has been successfully ${user.isSuspended ? 'suspended' : 'unsuspended'}.`, user }, 200);
  }

  try {
    const user = await User.findById(id);
    if (!user) {
      return errorResponse(res, 'User not found.', 404, 'USER_NOT_FOUND');
    }

    if (user._id.toString() === req.user.id) {
      return errorResponse(res, 'You cannot suspend your own admin account.', 400, 'SELF_SUSPENSION_BLOCKED');
    }

    user.isSuspended = !user.isSuspended;
    await user.save();

    logger.info({ userId: user._id, isSuspended: user.isSuspended, adminId: req.user.id }, 'User suspension state toggled');
    return successResponse(res, { message: `User account has been successfully ${user.isSuspended ? 'suspended' : 'unsuspended'}.`, user }, 200);
  } catch (error) {
    logger.error({ err: error.message, id }, 'Admin error suspending user');
    return errorResponse(res, 'Error toggling user suspension', 500, 'ADMIN_SUSPEND_USER_ERROR');
  }
});

// Get system-wide AI usage aggregates
router.get('/ai-usage', protect, isAdmin, async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    const summary = await localDb.getAiUsageSummary();
    return successResponse(res, {
      totalTokens: summary.totalTokens || 0,
      requestCount: summary.requestCount || 0,
      endpoints: summary.endpoints || [],
      globalUsage: { totalTokens: summary.totalTokens || 0, callCount: summary.requestCount || 0 },
      topUsers: []
    }, 200);
  }

  try {
    // Aggregation of total token counts and call volumes
    const aggregateData = await AiUsage.aggregate([
      {
        $group: {
          _id: null,
          totalTokens: { $sum: '$tokens' },
          callCount: { $sum: 1 }
        }
      }
    ]);

    const globalUsage = aggregateData[0] || { totalTokens: 0, callCount: 0 };

    // Group by endpoint to feed the frontend's endpoints list
    const endpoints = await AiUsage.aggregate([
      {
        $group: {
          _id: '$endpoint',
          totalTokens: { $sum: '$tokens' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalTokens: -1 } }
    ]);

    // Get top users consuming AI tokens
    const topUsers = await AiUsage.aggregate([
      {
        $group: {
          _id: '$userId',
          totalTokens: { $sum: '$tokens' },
          callCount: { $sum: 1 }
        }
      },
      { $sort: { totalTokens: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      { $unwind: '$userInfo' },
      {
        $project: {
          userId: '$_id',
          totalTokens: 1,
          callCount: 1,
          username: '$userInfo.username',
          email: '$userInfo.email'
        }
      }
    ]);

    return successResponse(res, {
      totalTokens: globalUsage.totalTokens || 0,
      requestCount: globalUsage.callCount || 0,
      endpoints: endpoints || [],
      globalUsage: {
        totalTokens: globalUsage.totalTokens || 0,
        callCount: globalUsage.callCount || 0
      },
      topUsers: topUsers || []
    }, 200);
  } catch (error) {
    logger.error({ err: error.message }, 'Admin error fetching AI usage analytics');
    return errorResponse(res, 'Error fetching AI usage records', 500, 'ADMIN_FETCH_AI_USAGE_ERROR');
  }
});

module.exports = router;
