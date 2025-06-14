import Feedback from '../models/Feedback.js';
import User from '../models/User.js';
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
