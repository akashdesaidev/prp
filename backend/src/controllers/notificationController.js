import notificationService from '../services/notificationService.js';
import Notification from '../models/Notification.js';
import logger from '../utils/logger.js';

// Get user notifications
export const getUserNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const userId = req.user.id;

    const result = await notificationService.getUserNotifications(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      unreadOnly: unreadOnly === 'true'
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error fetching user notifications:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications'
    });
  }
};

// Mark notification as read
export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await notificationService.markAsRead(id, userId);

    res.json({
      success: true,
      data: notification
    });
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      error:
        error.message === 'Notification not found'
          ? 'Notification not found'
          : 'Failed to mark notification as read'
    });
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await notificationService.markAllAsRead(userId);

    res.json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`
    });
  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read'
    });
  }
};

// Get notification preferences
export const getNotificationPreferences = async (req, res) => {
  try {
    const preferences = req.user.notificationPreferences;

    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    logger.error('Error fetching notification preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification preferences'
    });
  }
};

// Update notification preferences
export const updateNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const { emailNotifications, weeklyReminders, deadlineAlerts } = req.body;

    // Validate preferences
    const preferences = {
      emailNotifications: Boolean(emailNotifications),
      weeklyReminders: Boolean(weeklyReminders),
      deadlineAlerts: Boolean(deadlineAlerts)
    };

    const updatedPreferences = await notificationService.updateNotificationPreferences(
      userId,
      preferences
    );

    res.json({
      success: true,
      data: updatedPreferences,
      message: 'Notification preferences updated successfully'
    });
  } catch (error) {
    logger.error('Error updating notification preferences:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notification preferences'
    });
  }
};

// Send test notification (for testing purposes)
export const sendTestNotification = async (req, res) => {
  try {
    const userId = req.user.id;

    const notification = await notificationService.sendTestNotification(userId);

    res.json({
      success: true,
      data: notification,
      message: 'Test notification sent successfully'
    });
  } catch (error) {
    logger.error('Error sending test notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test notification'
    });
  }
};

// Create manual notification (admin only)
export const createManualNotification = async (req, res) => {
  try {
    // Only allow admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin role required.'
      });
    }

    const {
      userIds,
      type = 'system_announcement',
      title,
      message,
      priority = 'medium',
      sendEmail = true
    } = req.body;

    // Validate required fields
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'userIds array is required'
      });
    }

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        error: 'title and message are required'
      });
    }

    // Create notifications for all specified users
    const notifications = await Promise.all(
      userIds.map((userId) =>
        notificationService.createNotification({
          userId,
          type,
          title,
          message,
          priority,
          sendEmail,
          metadata: {
            createdByAdmin: req.user.id,
            isManual: true
          }
        })
      )
    );

    res.json({
      success: true,
      data: notifications,
      message: `${notifications.length} notifications created successfully`
    });
  } catch (error) {
    logger.error('Error creating manual notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create notifications'
    });
  }
};

// Delete notification (user can delete their own notifications)
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find and delete the notification
    const notification = await Notification.findOneAndDelete({
      _id: id,
      userId
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification'
    });
  }
};
