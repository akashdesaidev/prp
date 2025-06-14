import express from 'express';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationPreferences,
  updateNotificationPreferences,
  sendTestNotification,
  createManualNotification,
  deleteNotification
} from '../controllers/notificationController.js';
import auth from '../middleware/auth.js';
import { body, param, query } from 'express-validator';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Get user notifications
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('unreadOnly').optional().isBoolean().withMessage('unreadOnly must be a boolean')
  ],
  handleValidationErrors,
  getUserNotifications
);

// Mark notification as read
router.patch(
  '/:id/read',
  [param('id').isMongoId().withMessage('Invalid notification ID')],
  handleValidationErrors,
  markNotificationAsRead
);

// Mark all notifications as read
router.patch('/read-all', markAllNotificationsAsRead);

// Delete notification
router.delete(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid notification ID')],
  handleValidationErrors,
  deleteNotification
);

// Get notification preferences
router.get('/preferences', getNotificationPreferences);

// Update notification preferences
router.patch(
  '/preferences',
  [
    body('emailNotifications')
      .optional()
      .isBoolean()
      .withMessage('emailNotifications must be a boolean'),
    body('weeklyReminders').optional().isBoolean().withMessage('weeklyReminders must be a boolean'),
    body('deadlineAlerts').optional().isBoolean().withMessage('deadlineAlerts must be a boolean')
  ],
  handleValidationErrors,
  updateNotificationPreferences
);

// Send test notification
router.post('/test', sendTestNotification);

// Create manual notification (admin only)
router.post(
  '/manual',
  [
    body('userIds').isArray({ min: 1 }).withMessage('userIds must be a non-empty array'),
    body('userIds.*').isMongoId().withMessage('Each userId must be a valid MongoDB ID'),
    body('title').notEmpty().withMessage('Title is required'),
    body('message').notEmpty().withMessage('Message is required'),
    body('type')
      .optional()
      .isIn([
        'review_reminder',
        'feedback_received',
        'cycle_created',
        'deadline_approaching',
        'review_submitted',
        'peer_nomination_request',
        'okr_update_reminder',
        'system_announcement'
      ])
      .withMessage('Invalid notification type'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('Invalid priority'),
    body('sendEmail').optional().isBoolean().withMessage('sendEmail must be a boolean')
  ],
  handleValidationErrors,
  createManualNotification
);

export default router;
