import Feedback from '../models/Feedback.js';
import User from '../models/User.js';
import notificationService from '../services/notificationService.js';
import { validationResult } from 'express-validator';

// Get feedback for a user (received feedback)
export const getFeedbackForUser = async (req, res) => {
  try {
    const { userId = req.user.id, type, category, reviewCycleId, page = 1, limit = 20 } = req.query;

    // Check permissions - users can only see their own feedback unless admin/hr
    if (userId !== req.user.id && !['admin', 'hr'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const options = { type, category, reviewCycleId };

    const feedback = await Feedback.findForUser(userId, options)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Feedback.countDocuments({
      toUserId: userId,
      status: 'active',
      ...(type && { type }),
      ...(category && { category }),
      ...(reviewCycleId && { reviewCycleId })
    });

    res.json({
      success: true,
      data: feedback,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback',
      error: error.message
    });
  }
};

// Get feedback given by a user
export const getFeedbackByUser = async (req, res) => {
  try {
    const { type, category, page = 1, limit = 20 } = req.query;

    const userId = req.user.id;
    const options = { type, category };

    const feedback = await Feedback.findByUser(userId, options)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Feedback.countDocuments({
      fromUserId: userId,
      status: 'active',
      ...(type && { type }),
      ...(category && { category })
    });

    res.json({
      success: true,
      data: feedback,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching user feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback',
      error: error.message
    });
  }
};

// Get single feedback
export const getFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id)
      .populate('fromUserId', 'firstName lastName email')
      .populate('toUserId', 'firstName lastName email')
      .populate('reviewCycleId', 'name type');

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Check if user can view this feedback
    if (!feedback.canBeViewedBy(req.user.id) && !['admin', 'hr'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback',
      error: error.message
    });
  }
};

// Create new feedback
export const createFeedback = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      toUserId,
      content,
      rating,
      type = 'public',
      category = 'skills',
      tags = [],
      isAnonymous = false,
      reviewCycleId
    } = req.body;

    // Validate recipient exists
    const recipient = await User.findById(toUserId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient user not found'
      });
    }

    // Create feedback
    const feedback = new Feedback({
      fromUserId: req.user.id,
      toUserId,
      content,
      rating,
      type,
      category,
      tags,
      isAnonymous,
      reviewCycleId
    });

    await feedback.save();

    // Populate the saved feedback
    await feedback.populate([
      { path: 'fromUserId', select: 'firstName lastName email' },
      { path: 'toUserId', select: 'firstName lastName email' },
      { path: 'reviewCycleId', select: 'name type' }
    ]);

    // Send notification to recipient (if not anonymous)
    if (!isAnonymous) {
      try {
        await notificationService.notifyFeedbackReceived(
          feedback._id,
          toUserId,
          req.user.id,
          content
        );
      } catch (notificationError) {
        console.error('Failed to send feedback notification:', notificationError);
        // Don't fail the request if notification fails
      }
    }

    res.status(201).json({
      success: true,
      message: 'Feedback created successfully',
      data: feedback
    });
  } catch (error) {
    console.error('Error creating feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create feedback',
      error: error.message
    });
  }
};

// Update feedback
export const updateFeedback = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Check if user can edit this feedback
    if (!feedback.canBeEditedBy(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - cannot edit this feedback'
      });
    }

    const allowedUpdates = ['content', 'rating', 'type', 'category', 'tags'];
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        feedback[field] = req.body[field];
      }
    });

    await feedback.save();

    res.json({
      success: true,
      message: 'Feedback updated successfully',
      data: feedback
    });
  } catch (error) {
    console.error('Error updating feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update feedback',
      error: error.message
    });
  }
};

// Moderate feedback (hide/flag)
export const moderateFeedback = async (req, res) => {
  try {
    const { action, reason } = req.body;

    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Only admin, hr, or managers can moderate
    if (!['admin', 'hr', 'manager'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - insufficient permissions'
      });
    }

    if (action === 'hide') {
      if (!reason || reason.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Moderation reason is required for hiding feedback'
        });
      }

      feedback.status = 'hidden';
      feedback.moderatedBy = req.user.id;
      feedback.moderatedAt = new Date();
      feedback.moderationReason = reason;
    } else if (action === 'restore') {
      feedback.status = 'active';
      feedback.moderatedBy = req.user.id;
      feedback.moderatedAt = new Date();
      feedback.moderationReason = null;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be "hide" or "restore"'
      });
    }

    await feedback.save();

    res.json({
      success: true,
      message: `Feedback ${action}d successfully`,
      data: feedback
    });
  } catch (error) {
    console.error('Error moderating feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to moderate feedback',
      error: error.message
    });
  }
};

// Get feedback statistics for a user
export const getFeedbackStats = async (req, res) => {
  try {
    const { userId = req.user.id, timeRange } = req.query;

    // Check permissions
    if (userId !== req.user.id && !['admin', 'hr'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const stats = await Feedback.getFeedbackStats(userId, timeRange);
    const topSkills = await Feedback.getTopSkills(userId, 10);

    res.json({
      success: true,
      data: {
        stats: stats[0] || {
          totalFeedback: 0,
          averageRating: 0,
          positiveCount: 0,
          neutralCount: 0,
          negativeCount: 0
        },
        topSkills
      }
    });
  } catch (error) {
    console.error('Error fetching feedback stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback statistics',
      error: error.message
    });
  }
};

// Get all feedback for moderation (admin/hr only)
export const getAllFeedbackForModeration = async (req, res) => {
  try {
    const { status = 'active', type, filter, flagged = false, page = 1, limit = 20 } = req.query;

    const query = { status };

    // Handle filter parameter (all, public, private)
    if (filter && filter !== 'all') {
      query.type = filter;
    }

    // Handle type parameter (for backward compatibility)
    if (type && type !== 'all') {
      query.type = type;
    }

    if (flagged === 'true') query.status = 'flagged';

    console.log('Moderation query:', { filter, type, query });

    const feedback = await Feedback.find(query)
      .populate('fromUserId', 'firstName lastName email')
      .populate('toUserId', 'firstName lastName email')
      .populate('moderatedBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Feedback.countDocuments(query);

    res.json({
      success: true,
      data: feedback,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching feedback for moderation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback for moderation',
      error: error.message
    });
  }
};

// Get feedback sentiment analytics
export const getFeedbackSentimentAnalytics = async (req, res) => {
  try {
    const { timeRange = '30d', userId, departmentId } = req.query;

    console.log('📊 Getting sentiment analytics:', { timeRange, userId, departmentId });

    // Build date filter based on time range
    let dateFilter = {};
    if (timeRange) {
      const now = new Date();
      let startDate;

      switch (timeRange) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      dateFilter.createdAt = { $gte: startDate };
    }

    // Build user filter
    let userFilter = {};
    if (userId) {
      userFilter.toUserId = userId;
    } else if (req.user.role === 'manager') {
      // Managers can only see their team's sentiment
      const teamMembers = await User.find({ managerId: req.user.id }).select('_id');
      const teamIds = teamMembers.map((member) => member._id);
      teamIds.push(req.user.id); // Include manager's own feedback
      userFilter.toUserId = { $in: teamIds };
    } else if (req.user.role === 'employee') {
      // Employees can only see their own sentiment
      userFilter.toUserId = req.user.id;
    }
    // Admin and HR can see all (no filter)

    const matchStage = {
      status: 'active',
      sentimentScore: { $exists: true },
      ...dateFilter,
      ...userFilter
    };

    console.log('🔍 Match stage:', matchStage);

    // Aggregate sentiment data
    const sentimentAggregation = await Feedback.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$sentimentScore',
          count: { $sum: 1 },
          averageRating: { $avg: '$rating' }
        }
      }
    ]);

    // Get sentiment trends over time
    const trendAggregation = await Feedback.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            sentiment: '$sentimentScore',
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Calculate totals and percentages
    const totalFeedback = sentimentAggregation.reduce((sum, item) => sum + item.count, 0);

    const sentimentBreakdown = {
      positive: sentimentAggregation.find((s) => s._id === 'positive') || {
        count: 0,
        averageRating: 0
      },
      neutral: sentimentAggregation.find((s) => s._id === 'neutral') || {
        count: 0,
        averageRating: 0
      },
      negative: sentimentAggregation.find((s) => s._id === 'negative') || {
        count: 0,
        averageRating: 0
      }
    };

    // Calculate percentages
    Object.keys(sentimentBreakdown).forEach((sentiment) => {
      sentimentBreakdown[sentiment].percentage =
        totalFeedback > 0
          ? Math.round((sentimentBreakdown[sentiment].count / totalFeedback) * 100)
          : 0;
    });

    const analytics = {
      overview: {
        totalFeedback,
        timeRange,
        breakdown: sentimentBreakdown
      },
      trends: trendAggregation.reduce((acc, item) => {
        const date = item._id.date;
        if (!acc[date]) {
          acc[date] = { positive: 0, neutral: 0, negative: 0 };
        }
        acc[date][item._id.sentiment] = item.count;
        return acc;
      }, {}),
      insights: {
        dominantSentiment:
          totalFeedback > 0
            ? Object.keys(sentimentBreakdown).reduce((a, b) =>
                sentimentBreakdown[a].count > sentimentBreakdown[b].count ? a : b
              )
            : 'neutral',
        improvementNeeded: sentimentBreakdown.negative.percentage > 20,
        overallHealth:
          sentimentBreakdown.positive.percentage > 60
            ? 'good'
            : sentimentBreakdown.positive.percentage > 40
              ? 'moderate'
              : 'needs_attention'
      }
    };

    console.log('📈 Sentiment analytics generated:', {
      totalFeedback,
      dominantSentiment: analytics.insights.dominantSentiment,
      health: analytics.insights.overallHealth
    });

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('❌ Error getting sentiment analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sentiment analytics',
      error: error.message
    });
  }
};
