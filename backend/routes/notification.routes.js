const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth.middleware');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

// Get current user notifications (paginated)
router.get('/', protect, async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  if (mongoose.connection.readyState !== 1) {
    // Fallback if db is offline
    return successResponse(res, {
      notifications: [
        {
          _id: 'mock-notif-1',
          title: 'Welcome to Health Hub',
          message: 'Explore your health metrics logs and ask AI for coaching tips.',
          read: false,
          createdAt: new Date().toISOString()
        }
      ],
      totalPages: 1,
      totalCount: 1,
      currentPage: 1
    }, 200);
  }

  try {
    const totalCount = await Notification.countDocuments({ userId });
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return successResponse(res, {
      notifications,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      currentPage: page
    }, 200);
  } catch (error) {
    logger.error({ err: error.message, userId }, 'Error fetching notifications');
    return errorResponse(res, 'Error fetching notifications', 500, 'NOTIFICATIONS_FETCH_ERROR');
  }
});

// Mark single notification as read (with direct ownership enforcement)
router.put('/:id/read', protect, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  if (mongoose.connection.readyState !== 1) {
     return successResponse(res, { message: 'Notification marked read (Mock).' });
  }

  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return errorResponse(res, 'Notification not found or access denied.', 404, 'NOTIFICATION_NOT_FOUND');
    }

    return successResponse(res, { message: 'Notification marked as read.', notification }, 200);
  } catch (error) {
    logger.error({ err: error.message, id, userId }, 'Error updating notification status');
    return errorResponse(res, 'Error updating notification status', 500, 'NOTIFICATION_UPDATE_ERROR');
  }
});

// Mark all as read
router.put('/read-all', protect, async (req, res) => {
  const userId = req.user.id;

  if (mongoose.connection.readyState !== 1) {
    return successResponse(res, { message: 'All notifications marked read (Mock).' });
  }

  try {
    await Notification.updateMany({ userId, read: false }, { read: true });
    return successResponse(res, { message: 'All notifications marked as read.' }, 200);
  } catch (error) {
    logger.error({ err: error.message, userId }, 'Error marking all notifications as read');
    return errorResponse(res, 'Error updating notifications', 500, 'NOTIFICATION_UPDATE_ALL_ERROR');
  }
});

// Delete single notification
router.delete('/:id', protect, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  if (mongoose.connection.readyState !== 1) {
    return successResponse(res, { message: 'Notification deleted (Mock).' });
  }

  try {
    const notification = await Notification.findOneAndDelete({ _id: id, userId });

    if (!notification) {
      return errorResponse(res, 'Notification not found or access denied.', 404, 'NOTIFICATION_NOT_FOUND');
    }

    return successResponse(res, { message: 'Notification deleted successfully.' }, 200);
  } catch (error) {
    logger.error({ err: error.message, id, userId }, 'Error deleting notification');
    return errorResponse(res, 'Error deleting notification', 500, 'NOTIFICATION_DELETE_ERROR');
  }
});

module.exports = router;
