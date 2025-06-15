import Feedback from '../models/Feedback.js';
import User from '../models/User.js';
import notificationService from '../services/notificationService.js';
import aiService from '../services/aiService.js';
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

    // Analyze sentiment using AI
    let sentimentScore = null;
    let aiQualityFlags = [];

    try {
      const sentimentAnalysis = await aiService.analyzeSentiment(content);
      sentimentScore = sentimentAnalysis.sentiment;
      aiQualityFlags = sentimentAnalysis.qualityFlags || [];
    } catch (sentimentError) {
      console.warn(
        'AI sentiment analysis failed, continuing without sentiment:',
        sentimentError.message
      );
      // Continue without sentiment analysis - don't fail the entire request
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
      reviewCycleId,
      sentimentScore,
      aiQualityFlags
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

// Get all feedback for moderation (Admin/HR only)
export const getAllFeedbackForModeration = async (req, res) => {
  try {
    const { status = 'active', type, flagged, page = 1, limit = 20 } = req.query;

    const query = {
      ...(status && { status }),
      ...(type && { type }),
      ...(flagged !== undefined && { flagged: flagged === 'true' })
    };

    const feedback = await Feedback.find(query)
      .populate('fromUserId', 'firstName lastName email')
      .populate('toUserId', 'firstName lastName email')
      .populate('reviewCycleId', 'name type')
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

// Get sentiment analytics for feedback
export const getSentimentAnalytics = async (req, res) => {
  try {
    const { timeRange = '30d', userId, teamId, category } = req.query;

    // Permission check - users can only see their own data unless admin/hr
    if (userId && userId !== req.user.id && !['admin', 'hr'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Calculate date range
    const now = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '6m':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Build query
    const query = {
      createdAt: { $gte: startDate },
      status: 'active',
      sentimentScore: { $exists: true, $ne: null },
      ...(userId && { toUserId: userId }),
      ...(category && { category })
    };

    // Add team filter if specified
    if (teamId) {
      const teamUsers = await User.find({ teamId }).select('_id');
      const teamUserIds = teamUsers.map((user) => user._id);
      query.toUserId = { $in: teamUserIds };
    }

    // Get all feedback with sentiment
    const feedback = await Feedback.find(query)
      .populate('toUserId', 'firstName lastName')
      .populate('fromUserId', 'firstName lastName')
      .sort({ createdAt: -1 });

    if (feedback.length === 0) {
      return res.json({
        success: true,
        data: {
          overview: {
            totalFeedback: 0,
            sentimentScore: 0,
            distribution: { positive: 0, neutral: 0, negative: 0 },
            averageRating: 0,
            trend: { sentimentChange: 0, direction: 'neutral' }
          },
          detailed: {
            positive: { count: 0, percentage: 0, keywords: [], avgRating: 0 },
            neutral: { count: 0, percentage: 0, keywords: [], avgRating: 0 },
            negative: { count: 0, percentage: 0, keywords: [], avgRating: 0 }
          },
          trends: {
            timeline: [],
            monthlyTrend: []
          }
        }
      });
    }

    // Calculate sentiment distribution
    const sentimentCounts = {
      positive: feedback.filter((f) => f.sentimentScore === 'positive').length,
      neutral: feedback.filter((f) => f.sentimentScore === 'neutral').length,
      negative: feedback.filter((f) => f.sentimentScore === 'negative').length
    };

    // Calculate average ratings by sentiment
    const sentimentRatings = {
      positive: feedback.filter((f) => f.sentimentScore === 'positive' && f.rating),
      neutral: feedback.filter((f) => f.sentimentScore === 'neutral' && f.rating),
      negative: feedback.filter((f) => f.sentimentScore === 'negative' && f.rating)
    };

    const avgRatings = {
      positive:
        sentimentRatings.positive.length > 0
          ? sentimentRatings.positive.reduce((sum, f) => sum + f.rating, 0) /
            sentimentRatings.positive.length
          : 0,
      neutral:
        sentimentRatings.neutral.length > 0
          ? sentimentRatings.neutral.reduce((sum, f) => sum + f.rating, 0) /
            sentimentRatings.neutral.length
          : 0,
      negative:
        sentimentRatings.negative.length > 0
          ? sentimentRatings.negative.reduce((sum, f) => sum + f.rating, 0) /
            sentimentRatings.negative.length
          : 0
    };

    // Extract keywords (simple implementation - extract from tags)
    const getKeywords = (sentimentType) => {
      const sentimentFeedback = feedback.filter((f) => f.sentimentScore === sentimentType);
      const allTags = sentimentFeedback.flatMap((f) => f.tags || []);
      const tagCounts = {};

      allTags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });

      return Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([tag]) => tag);
    };

    // Calculate overall sentiment score (0-1 scale)
    const totalFeedback = feedback.length;
    const sentimentScore =
      (sentimentCounts.positive * 1 + sentimentCounts.neutral * 0.5) / totalFeedback;

    // Calculate average rating
    const ratedFeedback = feedback.filter((f) => f.rating);
    const averageRating =
      ratedFeedback.length > 0
        ? ratedFeedback.reduce((sum, f) => sum + f.rating, 0) / ratedFeedback.length
        : 0;

    // Calculate trend (compare with previous period)
    const previousStartDate = new Date(startDate);
    const periodLength = now.getTime() - startDate.getTime();
    previousStartDate.setTime(startDate.getTime() - periodLength);

    const previousQuery = {
      ...query,
      createdAt: { $gte: previousStartDate, $lt: startDate }
    };

    const previousFeedback = await Feedback.find(previousQuery);
    let sentimentChange = 0;
    let direction = 'neutral';

    if (previousFeedback.length > 0) {
      const previousPositive = previousFeedback.filter(
        (f) => f.sentimentScore === 'positive'
      ).length;
      const previousSentimentScore =
        (previousPositive * 1 +
          previousFeedback.filter((f) => f.sentimentScore === 'neutral').length * 0.5) /
        previousFeedback.length;
      sentimentChange = ((sentimentScore - previousSentimentScore) / previousSentimentScore) * 100;
      direction = sentimentChange > 0 ? 'up' : sentimentChange < 0 ? 'down' : 'neutral';
    }

    // Create timeline data (weekly for shorter periods, monthly for longer)
    const timeline = [];
    const isMonthly = ['6m', '1y'].includes(timeRange);
    const timeIncrement = isMonthly ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000; // 30 days or 7 days in ms

    for (
      let date = new Date(startDate);
      date <= now;
      date.setTime(date.getTime() + timeIncrement)
    ) {
      const periodEnd = new Date(Math.min(date.getTime() + timeIncrement, now.getTime()));
      const periodFeedback = feedback.filter((f) => f.createdAt >= date && f.createdAt < periodEnd);

      timeline.push({
        period: isMonthly
          ? date.toLocaleDateString('en', { month: 'short', year: 'numeric' })
          : `Week ${Math.ceil((date.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1}`,
        positive: periodFeedback.filter((f) => f.sentimentScore === 'positive').length,
        neutral: periodFeedback.filter((f) => f.sentimentScore === 'neutral').length,
        negative: periodFeedback.filter((f) => f.sentimentScore === 'negative').length
      });
    }

    const result = {
      overview: {
        totalFeedback,
        sentimentScore: Math.round(sentimentScore * 100) / 100,
        distribution: sentimentCounts,
        averageRating: Math.round(averageRating * 10) / 10,
        trend: {
          sentimentChange: Math.round(Math.abs(sentimentChange) * 10) / 10,
          direction
        }
      },
      detailed: {
        positive: {
          count: sentimentCounts.positive,
          percentage: Math.round((sentimentCounts.positive / totalFeedback) * 1000) / 10,
          keywords: getKeywords('positive'),
          avgRating: Math.round(avgRatings.positive * 10) / 10
        },
        neutral: {
          count: sentimentCounts.neutral,
          percentage: Math.round((sentimentCounts.neutral / totalFeedback) * 1000) / 10,
          keywords: getKeywords('neutral'),
          avgRating: Math.round(avgRatings.neutral * 10) / 10
        },
        negative: {
          count: sentimentCounts.negative,
          percentage: Math.round((sentimentCounts.negative / totalFeedback) * 1000) / 10,
          keywords: getKeywords('negative'),
          avgRating: Math.round(avgRatings.negative * 10) / 10
        }
      },
      trends: {
        timeline,
        monthlyTrend: timeline.slice(-6) // Last 6 periods
      }
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching sentiment analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sentiment analytics',
      error: error.message
    });
  }
};
