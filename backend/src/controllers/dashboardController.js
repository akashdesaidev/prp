import User from '../models/User.js';
import OKR from '../models/OKR.js';
import TimeEntry from '../models/TimeEntry.js';
import Feedback from '../models/Feedback.js';
import ReviewCycle from '../models/ReviewCycle.js';
import ReviewSubmission from '../models/ReviewSubmission.js';
import logger from '../utils/logger.js';

// @desc    Get recent activity for dashboard
// @route   GET /api/dashboard/activity
// @access  All authenticated users
export const getRecentActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    // Get recent activities from different sources
    const activities = [];

    // Recent OKR updates (last 7 days)
    const recentOKRs = await OKR.find({
      $or: [{ assignedTo: userId }, { createdBy: userId }],
      updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('assignedTo', 'firstName lastName');

    recentOKRs.forEach((okr) => {
      activities.push({
        type: 'okr_update',
        title: `Updated OKR: ${okr.title}`,
        description: `Progress updated for "${okr.title}"`,
        timestamp: okr.updatedAt,
        icon: 'target',
        color: 'blue'
      });
    });

    // Recent time entries (last 7 days)
    const recentTimeEntries = await TimeEntry.find({
      userId,
      date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    })
      .sort({ date: -1 })
      .limit(5)
      .populate('okrId', 'title');

    recentTimeEntries.forEach((entry) => {
      activities.push({
        type: 'time_logged',
        title: `Logged ${entry.hoursSpent} hours`,
        description: entry.description || `Time logged for ${entry.okrId?.title || 'project'}`,
        timestamp: entry.date,
        icon: 'clock',
        color: 'green'
      });
    });

    // Recent feedback received (last 7 days)
    const recentFeedback = await Feedback.find({
      toUserId: userId,
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    })
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('fromUserId', 'firstName lastName');

    recentFeedback.forEach((feedback) => {
      const fromName = feedback.isAnonymous
        ? 'Anonymous'
        : `${feedback.fromUserId.firstName} ${feedback.fromUserId.lastName}`;

      activities.push({
        type: 'feedback_received',
        title: `Received feedback from ${fromName}`,
        description:
          feedback.content.substring(0, 100) + (feedback.content.length > 100 ? '...' : ''),
        timestamp: feedback.createdAt,
        icon: 'message-circle',
        color: 'purple'
      });
    });

    // Recent review submissions (last 7 days)
    const recentReviews = await ReviewSubmission.find({
      reviewerId: userId,
      updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    })
      .sort({ updatedAt: -1 })
      .limit(3)
      .populate('revieweeId', 'firstName lastName')
      .populate('reviewCycleId', 'name');

    recentReviews.forEach((review) => {
      const revieweeName = `${review.revieweeId.firstName} ${review.revieweeId.lastName}`;
      const actionText = review.status === 'submitted' ? 'Submitted' : 'Updated';

      activities.push({
        type: 'review_activity',
        title: `${actionText} ${review.reviewType} review for ${revieweeName}`,
        description: `${review.reviewType} review in ${review.reviewCycleId.name} cycle`,
        timestamp: review.updatedAt,
        icon: 'file-text',
        color: 'indigo'
      });
    });

    // Ensure diverse activity types - limit each type to prevent dominance
    const maxPerType = Math.ceil(limit / 3); // Allow max 1/3 of activities from each type
    const diverseActivities = [];

    // Group by type
    const groupedActivities = activities.reduce((acc, activity) => {
      const type = activity.type;
      if (!acc[type]) acc[type] = [];
      acc[type].push(activity);
      return acc;
    }, {});

    // Take balanced samples from each type
    Object.values(groupedActivities).forEach((typeActivities) => {
      typeActivities
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, maxPerType)
        .forEach((activity) => diverseActivities.push(activity));
    });

    // Sort all activities by timestamp and limit
    const sortedActivities = diverseActivities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    res.json({
      activities: sortedActivities,
      total: sortedActivities.length
    });
  } catch (error) {
    logger.error('Dashboard activity error:', error);
    res.status(500).json({
      error: 'Failed to fetch recent activity',
      details: error.message
    });
  }
};

// @desc    Get dashboard summary stats
// @route   GET /api/dashboard/summary
// @access  All authenticated users
export const getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Base stats for all users
    const stats = {
      okrs: 0,
      timeEntries: 0,
      feedback: 0,
      reviews: 0
    };

    // Get user's OKRs count
    stats.okrs = await OKR.countDocuments({
      $or: [{ assignedTo: userId }, { createdBy: userId }],
      status: { $ne: 'archived' }
    });

    // Get user's time entries count (last 30 days)
    stats.timeEntries = await TimeEntry.countDocuments({
      userId,
      date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    // Get feedback count (received + given)
    const [receivedCount, givenCount] = await Promise.all([
      Feedback.countDocuments({ toUserId: userId }),
      Feedback.countDocuments({ fromUserId: userId })
    ]);
    stats.feedback = receivedCount + givenCount;

    // Get review cycles count (where user is participant)
    stats.reviews = await ReviewCycle.countDocuments({
      'participants.userId': userId,
      status: { $in: ['active', 'grace-period'] }
    });

    // Additional stats for admin/hr
    if (userRole === 'admin' || userRole === 'hr') {
      stats.teamMembers = await User.countDocuments({ isActive: true });
      stats.totalOKRs = await OKR.countDocuments({ status: { $ne: 'archived' } });
      stats.activeCycles = await ReviewCycle.countDocuments({
        status: { $in: ['active', 'grace-period'] }
      });
    }

    res.json(stats);
  } catch (error) {
    logger.error('Dashboard summary error:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard summary',
      details: error.message
    });
  }
};
