import Feedback from '../models/Feedback.js';
import User from '../models/User.js';
import notificationService from '../services/notificationService.js';
import { validationResult } from 'express-validator';

// Get feedback for a user (received feedback)
export const getFeedbackForUser = async (req, res) => {
  try {
    const {
      userId = req.user.id,
      type,
      category,
      reviewCycleId,
      sentiment,
      page = 1,
      limit = 20
    } = req.query;

    // Check permissions - users can only see their own feedback unless admin/hr
    if (userId !== req.user.id && !['admin', 'hr'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const options = { type, category, reviewCycleId, sentiment };

    const feedback = await Feedback.findForUser(userId, options)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Feedback.countDocuments({
      toUserId: userId,
      status: 'active',
      ...(type && { type }),
      ...(category && { category }),
      ...(reviewCycleId && { reviewCycleId }),
      ...(sentiment && { sentimentScore: sentiment })
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

// Get comprehensive feedback analytics for dashboard
// Helper function to get most active participants
const getMostActiveParticipants = async (baseQuery) => {
  try {
    const participantAggregation = await Feedback.aggregate([
      { $match: baseQuery },
      {
        $facet: {
          givers: [
            {
              $group: {
                _id: '$fromUserId',
                given: { $sum: 1 },
                avgRating: { $avg: '$rating' }
              }
            },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
            { $unwind: '$user' },
            { $sort: { given: -1 } },
            { $limit: 10 }
          ],
          receivers: [
            {
              $group: {
                _id: '$toUserId',
                received: { $sum: 1 },
                avgRating: { $avg: '$rating' }
              }
            },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
            { $unwind: '$user' },
            { $sort: { received: -1 } },
            { $limit: 10 }
          ]
        }
      }
    ]);

    const givers = participantAggregation[0]?.givers || [];
    const receivers = participantAggregation[0]?.receivers || [];

    // Combine giver and receiver data
    const participantMap = {};
    givers.forEach((giver) => {
      const userId = giver._id.toString();
      participantMap[userId] = {
        name: `${giver.user.firstName} ${giver.user.lastName}`,
        given: giver.given,
        received: 0,
        rating: Math.round(giver.avgRating * 10) / 10
      };
    });

    receivers.forEach((receiver) => {
      const userId = receiver._id.toString();
      if (participantMap[userId]) {
        participantMap[userId].received = receiver.received;
        participantMap[userId].rating =
          Math.round(((participantMap[userId].rating + receiver.avgRating) / 2) * 10) / 10;
      } else {
        participantMap[userId] = {
          name: `${receiver.user.firstName} ${receiver.user.lastName}`,
          given: 0,
          received: receiver.received,
          rating: Math.round(receiver.avgRating * 10) / 10
        };
      }
    });

    // Get most active participants (by total activity)
    return Object.values(participantMap)
      .map((p) => ({
        ...p,
        totalActivity: p.given + p.received
      }))
      .sort((a, b) => b.totalActivity - a.totalActivity)
      .slice(0, 8)
      .map(({ totalActivity, ...rest }) => rest);
  } catch (error) {
    console.error('Error getting active participants:', error);
    return [{ name: 'No Data Available', given: 0, received: 0, rating: 0 }];
  }
};

// Helper function to get skills data from feedback tags
const getSkillsData = async (baseQuery) => {
  try {
    const skillsAggregation = await Feedback.aggregate([
      { $match: baseQuery },
      { $unwind: '$tags' },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 },
          avgRating: { $avg: '$rating' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const topSkills = skillsAggregation.map((skill) => ({
      name: skill._id,
      count: skill.count,
      avgRating: Math.round(skill.avgRating * 10) / 10,
      trend: Math.floor(Math.random() * 30) - 10 // Mock trend for now
    }));

    return {
      mostFeedback: topSkills.slice(0, 5),
      emerging: topSkills.slice(-3).map((skill) => ({
        name: skill.name,
        count: skill.count,
        trend: Math.floor(Math.random() * 100) + 50 // Mock high trend for emerging
      }))
    };
  } catch (error) {
    console.error('Error getting skills data:', error);
    return {
      mostFeedback: [{ name: 'Communication', count: 0, avgRating: 0, trend: 0 }],
      emerging: [{ name: 'No Data', count: 0, trend: 0 }]
    };
  }
};

export const getFeedbackAnalytics = async (req, res) => {
  try {
    const { timeRange = '30d', category, userId, teamId } = req.query;

    console.log('📊 Getting feedback analytics:', { timeRange, category, userId, teamId });

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
        case '6m':
          startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      dateFilter.createdAt = { $gte: startDate };
    }

    // Build user filter based on role
    let userFilter = {};
    if (userId) {
      userFilter.toUserId = userId;
    } else if (req.user.role === 'manager') {
      // Managers can only see their team's feedback
      const teamMembers = await User.find({ managerId: req.user.id }).select('_id');
      const teamIds = teamMembers.map((member) => member._id);
      teamIds.push(req.user.id); // Include manager's own feedback
      userFilter.toUserId = { $in: teamIds };
    } else if (req.user.role === 'employee') {
      // Employees can only see their own feedback
      userFilter.toUserId = req.user.id;
    }
    // Admin and HR can see all (no filter)

    const baseQuery = {
      status: 'active',
      ...dateFilter,
      ...userFilter,
      ...(category && category !== 'all' && { category })
    };

    console.log('🔍 Base query:', baseQuery);

    // Get basic statistics
    const totalFeedback = await Feedback.countDocuments(baseQuery);
    const feedbackWithRating = await Feedback.find({ ...baseQuery, rating: { $exists: true } });
    const averageRating =
      feedbackWithRating.length > 0
        ? feedbackWithRating.reduce((sum, f) => sum + f.rating, 0) / feedbackWithRating.length
        : 0;

    // Get sentiment breakdown
    const sentimentCounts = await Feedback.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: '$sentimentScore',
          count: { $sum: 1 }
        }
      }
    ]);

    const sentimentBreakdown = {
      positive: sentimentCounts.find((s) => s._id === 'positive')?.count || 0,
      neutral: sentimentCounts.find((s) => s._id === 'neutral')?.count || 0,
      negative: sentimentCounts.find((s) => s._id === 'negative')?.count || 0
    };

    // Get department breakdown for admin users
    let departmentBreakdown = [];
    if (req.user.role === 'admin' || req.user.role === 'hr') {
      const departmentData = await Feedback.aggregate([
        { $match: baseQuery },
        {
          $lookup: {
            from: 'users',
            localField: 'toUserId',
            foreignField: '_id',
            as: 'toUser'
          }
        },
        { $unwind: '$toUser' },
        {
          $group: {
            _id: '$toUser.department',
            feedbackCount: { $sum: 1 },
            avgRating: { $avg: '$rating' },
            sentimentCounts: {
              $push: '$sentimentScore'
            }
          }
        },
        {
          $project: {
            _id: 1,
            name: '$_id',
            feedbackCount: 1,
            avgRating: { $round: ['$avgRating', 1] },
            positiveCount: {
              $size: {
                $filter: {
                  input: '$sentimentCounts',
                  cond: { $eq: ['$$this', 'positive'] }
                }
              }
            },
            positivePercentage: {
              $multiply: [
                {
                  $divide: [
                    {
                      $size: {
                        $filter: {
                          input: '$sentimentCounts',
                          cond: { $eq: ['$$this', 'positive'] }
                        }
                      }
                    },
                    '$feedbackCount'
                  ]
                },
                100
              ]
            }
          }
        },
        { $sort: { avgRating: -1 } }
      ]);

      departmentBreakdown = departmentData;
    }

    // Get active users count
    const activeUsersCount = await Feedback.distinct('toUserId', baseQuery).then(
      (users) => users.length
    );

    // Mock additional analytics data that the frontend expects
    const analytics = {
      summary: {
        totalFeedback,
        averageRating: Math.round(averageRating * 10) / 10,
        responseRate: Math.floor(Math.random() * 30) + 70, // Mock response rate
        sentimentScore: totalFeedback > 0 ? sentimentBreakdown.positive / totalFeedback : 0,
        growthRate: Math.floor(Math.random() * 20) - 5, // Mock growth rate
        activeUsers: activeUsersCount,
        departments: departmentBreakdown.length,
        trendingSkills: ['Communication', 'Problem Solving', 'Leadership']
      },
      sentiment: {
        positive: sentimentBreakdown.positive,
        neutral: sentimentBreakdown.neutral,
        negative: sentimentBreakdown.negative,
        distribution: [
          { name: 'Positive', value: sentimentBreakdown.positive, color: '#22c55e' },
          { name: 'Neutral', value: sentimentBreakdown.neutral, color: '#6b7280' },
          { name: 'Negative', value: sentimentBreakdown.negative, color: '#ef4444' }
        ]
      },
      skills: await getSkillsData(baseQuery),
      categories: {
        skills: { count: Math.floor(totalFeedback * 0.6), avgRating: 4.2, trend: 8 },
        values: { count: Math.floor(totalFeedback * 0.3), avgRating: 4.4, trend: 15 },
        initiatives: { count: Math.floor(totalFeedback * 0.1), avgRating: 3.9, trend: -5 }
      },
      participants: {
        mostActive: await getMostActiveParticipants(baseQuery)
      },
      // Admin-specific data
      departmentBreakdown,
      topSkills: [
        { name: 'Communication', count: Math.floor(totalFeedback * 0.3), avgRating: 4.2, trend: 8 },
        {
          name: 'Problem Solving',
          count: Math.floor(totalFeedback * 0.25),
          avgRating: 4.1,
          trend: 15
        },
        { name: 'Teamwork', count: Math.floor(totalFeedback * 0.2), avgRating: 4.5, trend: -2 },
        { name: 'Leadership', count: Math.floor(totalFeedback * 0.15), avgRating: 3.9, trend: 22 },
        { name: 'Innovation', count: Math.floor(totalFeedback * 0.1), avgRating: 4.2, trend: 35 }
      ],
      mostActiveUsers: await getMostActiveParticipants(baseQuery)
    };

    console.log('📈 Feedback analytics generated:', {
      totalFeedback,
      averageRating: analytics.summary.averageRating,
      sentimentBreakdown
    });

    res.json(analytics);
  } catch (error) {
    console.error('❌ Error getting feedback analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get feedback analytics',
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
