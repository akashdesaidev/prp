import cron from 'node-cron';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import ReviewCycle from '../models/ReviewCycle.js';
import emailService from './emailService.js';
import logger from '../utils/logger.js';

class NotificationService {
  constructor() {
    this.scheduledJobs = new Map();
    this.initializeScheduledJobs();
  }

  // Initialize scheduled jobs
  initializeScheduledJobs() {
    // Daily reminder check at 9 AM
    cron.schedule('0 9 * * *', () => {
      this.processDailyReminders();
    });

    // Hourly urgent deadline check
    cron.schedule('0 * * * *', () => {
      this.processUrgentDeadlines();
    });

    // Process scheduled notifications every 5 minutes
    cron.schedule('*/5 * * * *', () => {
      this.processScheduledNotifications();
    });

    logger.info('Notification service scheduled jobs initialized');
  }

  // Create a new notification
  async createNotification({
    userId,
    type,
    title,
    message,
    relatedId = null,
    relatedType = null,
    priority = 'medium',
    actions = [],
    metadata = {},
    scheduledFor = null,
    sendEmail = true
  }) {
    try {
      const notification = new Notification({
        userId,
        type,
        title,
        message,
        relatedId,
        relatedType,
        priority,
        actions,
        metadata,
        scheduledFor: scheduledFor || new Date()
      });

      await notification.save();

      // Send email immediately if not scheduled and user preferences allow
      if (!scheduledFor && sendEmail) {
        await this.sendEmailNotification(notification);
      }

      logger.info(`Notification created for user ${userId}`, { type, title });
      return notification;
    } catch (error) {
      logger.error('Failed to create notification:', error);
      throw error;
    }
  }

  // Send email notification
  async sendEmailNotification(notification) {
    try {
      const user = await User.findById(notification.userId);
      if (!user || !user.notificationPreferences.emailNotifications) {
        return { success: false, reason: 'User email notifications disabled' };
      }

      const userName = `${user.firstName} ${user.lastName}`;
      let result;

      switch (notification.type) {
        case 'review_reminder':
          result = await emailService.sendReviewReminder(
            user.email,
            userName,
            notification.metadata.reviewType || 'Review',
            notification.metadata.dueDate || 'Soon'
          );
          break;

        case 'feedback_received':
          result = await emailService.sendFeedbackNotification(
            user.email,
            userName,
            notification.metadata.fromUserName || 'Someone',
            notification.metadata.feedbackPreview || notification.message
          );
          break;

        case 'cycle_created':
          result = await emailService.sendCycleNotification(
            user.email,
            userName,
            notification.metadata.cycleName || 'New Cycle',
            notification.metadata.startDate || 'TBD',
            notification.metadata.endDate || 'TBD',
            notification.metadata.reviewTypes || 'Various'
          );
          break;

        case 'deadline_approaching':
          result = await emailService.sendDeadlineAlert(
            user.email,
            userName,
            notification.metadata.hoursLeft || 24
          );
          break;

        default:
          // Generic email for other types
          result = await emailService.sendEmail(user.email, 'generic', {
            userName,
            message: notification.message
          });
      }

      if (result.success) {
        notification.emailSent = true;
        notification.sentAt = new Date();
        await notification.save();
      }

      return result;
    } catch (error) {
      logger.error('Failed to send email notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Process scheduled notifications
  async processScheduledNotifications() {
    try {
      const now = new Date();
      const pendingNotifications = await Notification.find({
        scheduledFor: { $lte: now },
        emailSent: false
      }).populate('userId');

      for (const notification of pendingNotifications) {
        await this.sendEmailNotification(notification);
      }

      if (pendingNotifications.length > 0) {
        logger.info(`Processed ${pendingNotifications.length} scheduled notifications`);
      }
    } catch (error) {
      logger.error('Error processing scheduled notifications:', error);
    }
  }

  // Daily reminder processing
  async processDailyReminders() {
    try {
      logger.info('Processing daily reminders...');

      // Find active review cycles
      const activeReviewCycles = await ReviewCycle.find({
        status: 'active',
        endDate: { $gte: new Date() }
      }).populate('participants.userId');

      for (const cycle of activeReviewCycles) {
        await this.processReviewCycleReminders(cycle);
      }

      logger.info('Daily reminders processing completed');
    } catch (error) {
      logger.error('Error processing daily reminders:', error);
    }
  }

  // Process review cycle reminders
  async processReviewCycleReminders(cycle) {
    try {
      const now = new Date();
      const endDate = new Date(cycle.endDate);
      const daysUntilDeadline = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

      // Send reminders at 7, 3, and 1 days before deadline
      const reminderDays = [7, 3, 1];

      if (reminderDays.includes(daysUntilDeadline)) {
        for (const participant of cycle.participants) {
          if (participant.status === 'pending') {
            await this.createReviewReminder(
              participant.userId._id,
              cycle,
              participant.role,
              daysUntilDeadline
            );
          }
        }
      }
    } catch (error) {
      logger.error('Error processing review cycle reminders:', error);
    }
  }

  // Create review reminder notification
  async createReviewReminder(userId, cycle, reviewType, daysLeft) {
    const title = `Review Reminder: ${daysLeft} day${daysLeft > 1 ? 's' : ''} left`;
    const message = `Your ${reviewType} review for "${cycle.name}" is due in ${daysLeft} day${daysLeft > 1 ? 's' : ''}. Please complete it soon.`;

    return this.createNotification({
      userId,
      type: 'review_reminder',
      title,
      message,
      relatedId: cycle._id,
      relatedType: 'cycle',
      priority: daysLeft === 1 ? 'high' : 'medium',
      actions: [
        {
          label: 'Complete Review',
          url: `/reviews/submit/${cycle._id}`,
          type: 'primary'
        }
      ],
      metadata: {
        reviewType,
        dueDate: cycle.endDate.toLocaleDateString(),
        daysLeft
      }
    });
  }

  // Process urgent deadlines (within 24 hours)
  async processUrgentDeadlines() {
    try {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const urgentCycles = await ReviewCycle.find({
        status: 'active',
        endDate: { $gte: now, $lte: tomorrow }
      }).populate('participants.userId');

      for (const cycle of urgentCycles) {
        for (const participant of cycle.participants) {
          if (participant.status === 'pending') {
            const hoursLeft = Math.ceil((cycle.endDate - now) / (1000 * 60 * 60));

            await this.createNotification({
              userId: participant.userId._id,
              type: 'deadline_approaching',
              title: 'Urgent: Review Deadline Approaching',
              message: `Your review deadline is in ${hoursLeft} hours. Complete it now to avoid missing the deadline.`,
              relatedId: cycle._id,
              relatedType: 'cycle',
              priority: 'urgent',
              actions: [
                {
                  label: 'Complete Now',
                  url: `/reviews/submit/${cycle._id}`,
                  type: 'primary'
                }
              ],
              metadata: {
                hoursLeft,
                reviewType: participant.role
              }
            });
          }
        }
      }
    } catch (error) {
      logger.error('Error processing urgent deadlines:', error);
    }
  }

  // Notification for new feedback
  async notifyFeedbackReceived(feedbackId, toUserId, fromUserId, feedbackContent) {
    try {
      const fromUser = await User.findById(fromUserId);
      const fromUserName = `${fromUser.firstName} ${fromUser.lastName}`;

      return this.createNotification({
        userId: toUserId,
        type: 'feedback_received',
        title: 'New Feedback Received',
        message: `You received new feedback from ${fromUserName}`,
        relatedId: feedbackId,
        relatedType: 'feedback',
        priority: 'medium',
        actions: [
          {
            label: 'View Feedback',
            url: '/feedback',
            type: 'primary'
          }
        ],
        metadata: {
          fromUserName,
          feedbackPreview: feedbackContent
        }
      });
    } catch (error) {
      logger.error('Error creating feedback notification:', error);
      throw error;
    }
  }

  // Notification for new review cycle
  async notifyReviewCycleCreated(cycleId, participantUserIds) {
    try {
      const cycle = await ReviewCycle.findById(cycleId);

      const notifications = participantUserIds.map((userId) =>
        this.createNotification({
          userId,
          type: 'cycle_created',
          title: `New Review Cycle: ${cycle.name}`,
          message: `A new review cycle "${cycle.name}" has been created. Check your assignments.`,
          relatedId: cycleId,
          relatedType: 'cycle',
          priority: 'medium',
          actions: [
            {
              label: 'View Details',
              url: '/reviews',
              type: 'primary'
            }
          ],
          metadata: {
            cycleName: cycle.name,
            startDate: cycle.startDate.toLocaleDateString(),
            endDate: cycle.endDate.toLocaleDateString(),
            reviewTypes: Object.keys(cycle.reviewTypes)
              .filter((key) => cycle.reviewTypes[key])
              .join(', ')
          }
        })
      );

      return Promise.all(notifications);
    } catch (error) {
      logger.error('Error creating cycle notifications:', error);
      throw error;
    }
  }

  // Get user notifications
  async getUserNotifications(userId, { page = 1, limit = 20, unreadOnly = false } = {}) {
    try {
      const query = { userId };
      if (unreadOnly) {
        query.isRead = false;
      }

      const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const totalCount = await Notification.countDocuments(query);
      const unreadCount = await Notification.countDocuments({
        userId,
        isRead: false
      });

      return {
        notifications,
        totalCount,
        unreadCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit)
      };
    } catch (error) {
      logger.error('Error fetching user notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        { isRead: true },
        { new: true }
      );

      if (!notification) {
        throw new Error('Notification not found');
      }

      return notification;
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead(userId) {
    try {
      const result = await Notification.updateMany({ userId, isRead: false }, { isRead: true });

      return result;
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Update user notification preferences
  async updateNotificationPreferences(userId, preferences) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { notificationPreferences: preferences },
        { new: true }
      );

      return user.notificationPreferences;
    } catch (error) {
      logger.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  // Test notification system
  async sendTestNotification(userId) {
    return this.createNotification({
      userId,
      type: 'system_announcement',
      title: 'Test Notification',
      message: 'This is a test notification to verify the system is working correctly.',
      priority: 'low',
      metadata: {
        isTest: true
      }
    });
  }
}

export default new NotificationService();
