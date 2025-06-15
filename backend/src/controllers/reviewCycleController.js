import ReviewCycle from '../models/ReviewCycle.js';
import User from '../models/User.js';
import notificationService from '../services/notificationService.js';
import { validationResult } from 'express-validator';

// Get all review cycles with filtering and pagination
export const getReviewCycles = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 10 } = req.query;
    const userRole = req.user.role;
    const userId = req.user.id;

    let query = {};
    if (status && status !== 'all') query.status = status;
    if (type && type !== 'all') query.type = type;

    console.log('Query filters:', { status, type, query, userRole });

    // Role-based filtering
    if (userRole === 'employee') {
      // Employees can only see active/grace-period cycles they're participating in
      query.status = { $in: ['active', 'grace-period'] };
      query['participants.userId'] = userId;
    } else if (userRole === 'manager') {
      // Managers can see all cycles but with some restrictions
      // For now, let them see all cycles like admin/hr
    }
    // Admin and HR can see all cycles without additional filtering

    const reviewCycles = await ReviewCycle.find(query)
      .populate('createdBy', 'firstName lastName email')
      .populate('participants.userId', 'firstName lastName email role')
      .sort({ createdAt: -1 });

    console.log('Found review cycles (before pagination):', reviewCycles.length);

    // Apply pagination manually
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedCycles = reviewCycles.slice(startIndex, endIndex);

    console.log('Paginated cycles:', paginatedCycles.length);

    const total = reviewCycles.length;

    // Transform questions to include type field for frontend compatibility
    const transformedCycles = paginatedCycles.map((cycle) => ({
      ...cycle.toObject(),
      questions: cycle.questions.map((q) => ({
        ...q.toObject(),
        type: q.requiresRating ? 'rating_text' : 'text', // Add type field based on requiresRating
        text: q.question // Also map question field to text for frontend compatibility
      }))
    }));

    res.json({
      success: true,
      data: transformedCycles,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching review cycles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch review cycles',
      error: error.message
    });
  }
};

// Get single review cycle
export const getReviewCycle = async (req, res) => {
  try {
    const reviewCycle = await ReviewCycle.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email')
      .populate('participants.userId', 'firstName lastName email role');

    if (!reviewCycle) {
      return res.status(404).json({
        success: false,
        message: 'Review cycle not found'
      });
    }

    // Transform questions to include type field for frontend compatibility
    const transformedReviewCycle = {
      ...reviewCycle.toObject(),
      questions: reviewCycle.questions.map((q) => ({
        ...q.toObject(),
        type: q.requiresRating ? 'rating_text' : 'text', // Add type field based on requiresRating
        text: q.question // Also map question field to text for frontend compatibility
      }))
    };

    res.json({
      success: true,
      data: transformedReviewCycle
    });
  } catch (error) {
    console.error('Error fetching review cycle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch review cycle',
      error: error.message
    });
  }
};

// Create new review cycle
export const createReviewCycle = async (req, res) => {
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
      name,
      type,
      startDate,
      endDate,
      gracePeriodDays,
      reviewTypes,
      minPeerReviewers,
      maxPeerReviewers,
      questions,
      isEmergency
    } = req.body;

    // Validate date ranges
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be before end date'
      });
    }

    // Require minimum 3-day buffer for non-emergency cycles
    if (!isEmergency && start < new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)) {
      return res.status(400).json({
        success: false,
        message: 'Review cycle must start at least 3 days from now (unless emergency)'
      });
    }

    // Transform questions from frontend format to backend format
    const transformedQuestions = (questions || []).map((q, index) => ({
      category: q.category || 'overall',
      question: q.question || q.text || '', // Support both 'question' and 'text' fields
      requiresRating: q.requiresRating !== undefined ? q.requiresRating : true,
      ratingScale: q.ratingScale || 10,
      isRequired: q.isRequired !== undefined ? q.isRequired : true,
      order: q.order !== undefined ? q.order : index
    }));

    // Create review cycle
    const reviewCycle = new ReviewCycle({
      name,
      type,
      startDate: start,
      endDate: end,
      gracePeriodDays: gracePeriodDays || 3,
      reviewTypes: reviewTypes || {
        selfReview: true,
        peerReview: true,
        managerReview: true,
        upwardReview: false
      },
      minPeerReviewers: minPeerReviewers || 3,
      maxPeerReviewers: maxPeerReviewers || 5,
      questions: transformedQuestions,
      createdBy: req.user.id,
      isEmergency: isEmergency || false
    });

    await reviewCycle.save();

    // Send notifications to all users about the new review cycle
    try {
      const allUsers = await User.find({ isActive: true }).select('_id');
      const userIds = allUsers.map((user) => user._id);

      if (userIds.length > 0) {
        await notificationService.notifyReviewCycleCreated(reviewCycle._id, userIds);
      }
    } catch (notificationError) {
      console.error('Failed to send review cycle notifications:', notificationError);
      // Don't fail the request if notification fails
    }

    res.status(201).json({
      success: true,
      message: 'Review cycle created successfully',
      data: reviewCycle
    });
  } catch (error) {
    console.error('Error creating review cycle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create review cycle',
      error: error.message
    });
  }
};

// Update review cycle
export const updateReviewCycle = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const reviewCycle = await ReviewCycle.findById(req.params.id);

    if (!reviewCycle) {
      return res.status(404).json({
        success: false,
        message: 'Review cycle not found'
      });
    }

    // Check if cycle can be modified
    if (reviewCycle.status === 'closed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify closed review cycle'
      });
    }

    const allowedUpdates = [
      'name',
      'endDate',
      'gracePeriodDays',
      'reviewTypes',
      'minPeerReviewers',
      'maxPeerReviewers',
      'questions',
      'isEmergency'
    ];

    // Only allow status updates for specific transitions
    if (req.body.status) {
      const validTransitions = {
        draft: ['active'],
        active: ['grace-period'],
        'grace-period': ['closed']
      };

      if (!validTransitions[reviewCycle.status]?.includes(req.body.status)) {
        return res.status(400).json({
          success: false,
          message: `Cannot transition from ${reviewCycle.status} to ${req.body.status}`
        });
      }

      allowedUpdates.push('status');
    }

    // Store old status to check for transitions
    const oldStatus = reviewCycle.status;

    // Update allowed fields with special handling for questions
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === 'questions') {
          // Transform questions from frontend format to backend format
          const transformedQuestions = req.body.questions.map((q, index) => ({
            category: q.category || 'overall',
            question: q.question || q.text || '', // Support both 'question' and 'text' fields
            requiresRating: q.requiresRating !== undefined ? q.requiresRating : true,
            ratingScale: q.ratingScale || 10,
            isRequired: q.isRequired !== undefined ? q.isRequired : true,
            order: q.order !== undefined ? q.order : index
          }));
          reviewCycle[field] = transformedQuestions;
        } else {
          reviewCycle[field] = req.body[field];
        }
      }
    });

    await reviewCycle.save();

    // Auto-create review submissions when cycle becomes active
    if (oldStatus !== 'active' && reviewCycle.status === 'active') {
      try {
        const { createReviewSubmissionsForCycle } = await import('./reviewSubmissionController.js');
        await createReviewSubmissionsForCycle(reviewCycle._id);
        console.log(`Auto-created review submissions for cycle: ${reviewCycle.name}`);
      } catch (error) {
        console.error('Error auto-creating review submissions:', error);
        // Don't fail the update if submission creation fails
      }
    }

    res.json({
      success: true,
      message: 'Review cycle updated successfully',
      data: reviewCycle
    });
  } catch (error) {
    console.error('Error updating review cycle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review cycle',
      error: error.message
    });
  }
};

// Delete review cycle (soft delete)
export const deleteReviewCycle = async (req, res) => {
  try {
    const reviewCycle = await ReviewCycle.findById(req.params.id);
    if (!reviewCycle) {
      return res.status(404).json({
        success: false,
        message: 'Review cycle not found'
      });
    }

    // Only allow deletion of draft cycles
    if (reviewCycle.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Can only delete draft review cycles'
      });
    }

    reviewCycle.status = 'closed';
    await reviewCycle.save();

    res.json({
      success: true,
      message: 'Review cycle deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting review cycle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review cycle',
      error: error.message
    });
  }
};

// Assign participants to review cycle
export const assignParticipants = async (req, res) => {
  try {
    const { userIds } = req.body;
    const reviewCycleId = req.params.id;

    const reviewCycle = await ReviewCycle.findById(reviewCycleId);
    if (!reviewCycle) {
      return res.status(404).json({
        success: false,
        message: 'Review cycle not found'
      });
    }

    const users = await User.find({ _id: { $in: userIds } });
    const assignments = [];

    for (const user of users) {
      const existingParticipant = reviewCycle.participants.find(
        (p) => p.userId.toString() === user._id.toString()
      );

      if (!existingParticipant) {
        reviewCycle.participants.push({
          userId: user._id,
          role: 'reviewee',
          status: 'pending'
        });

        assignments.push({
          userId: user._id,
          userName: `${user.firstName} ${user.lastName}`,
          assigned: true
        });
      } else {
        assignments.push({
          userId: user._id,
          userName: `${user.firstName} ${user.lastName}`,
          assigned: false,
          reason: 'Already assigned'
        });
      }
    }

    await reviewCycle.save();

    res.json({
      success: true,
      message: 'Participants assigned successfully',
      data: assignments
    });
  } catch (error) {
    console.error('Error assigning participants:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign participants',
      error: error.message
    });
  }
};

// Get review cycle statistics
export const getReviewCycleStats = async (req, res) => {
  try {
    const reviewCycleId = req.params.id;

    const reviewCycle = await ReviewCycle.findById(reviewCycleId);
    if (!reviewCycle) {
      return res.status(404).json({
        success: false,
        message: 'Review cycle not found'
      });
    }

    // Get participant counts
    const participantCounts = {
      total: reviewCycle.participants.length,
      submitted: reviewCycle.participants.filter((p) => p.status === 'submitted').length,
      pending: reviewCycle.participants.filter((p) => p.status === 'pending').length,
      notSubmitted: reviewCycle.participants.filter((p) => p.status === 'not-submitted').length
    };

    // Calculate completion percentage
    const completionPercentage =
      participantCounts.total > 0
        ? Math.round((participantCounts.submitted / participantCounts.total) * 100)
        : 0;

    res.json({
      success: true,
      data: {
        reviewCycle: {
          id: reviewCycle._id,
          name: reviewCycle.name,
          status: reviewCycle.status,
          startDate: reviewCycle.startDate,
          endDate: reviewCycle.endDate
        },
        participants: participantCounts,
        completionPercentage
      }
    });
  } catch (error) {
    console.error('Error fetching review cycle stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch review cycle statistics',
      error: error.message
    });
  }
};

// Get user's active review cycles
export const getUserActiveReviewCycles = async (req, res) => {
  try {
    const userId = req.user.id;

    const activeReviewCycles = await ReviewCycle.find({
      'participants.userId': userId,
      status: { $in: ['active', 'grace-period'] }
    }).populate('participants.userId', 'firstName lastName email');

    res.json({
      success: true,
      data: activeReviewCycles
    });
  } catch (error) {
    console.error('Error fetching user active review cycles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active review cycles',
      error: error.message
    });
  }
};

// Get general review cycle statistics
export const getGeneralStats = async (req, res) => {
  try {
    const totalCycles = await ReviewCycle.countDocuments();
    const activeCycles = await ReviewCycle.countDocuments({ status: 'active' });
    const draftCycles = await ReviewCycle.countDocuments({ status: 'draft' });
    const closedCycles = await ReviewCycle.countDocuments({ status: 'closed' });
    const gracePeriodCycles = await ReviewCycle.countDocuments({ status: 'grace-period' });

    res.json({
      success: true,
      data: {
        total: totalCycles,
        active: activeCycles,
        draft: draftCycles,
        completed: closedCycles,
        gracePeriod: gracePeriodCycles,
        pending: draftCycles + activeCycles + gracePeriodCycles
      }
    });
  } catch (error) {
    console.error('Error fetching general stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};

// Debug endpoint to test raw data
export const debugReviewCycles = async (req, res) => {
  try {
    console.log('=== DEBUG REVIEW CYCLES ===');

    // Test 1: Simple find all
    const allCycles = await ReviewCycle.find({});
    console.log('All cycles (no filter):', allCycles.length);

    // Test 2: Find with empty query object
    const emptyQuery = await ReviewCycle.find({});
    console.log('Empty query result:', emptyQuery.length);

    // Test 3: Check first few documents
    if (allCycles.length > 0) {
      console.log('First cycle:', {
        id: allCycles[0]._id,
        name: allCycles[0].name,
        status: allCycles[0].status,
        type: allCycles[0].type
      });
    }

    res.json({
      success: true,
      data: {
        totalFound: allCycles.length,
        cycles: allCycles.map((cycle) => ({
          id: cycle._id,
          name: cycle.name,
          status: cycle.status,
          type: cycle.type,
          createdAt: cycle.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
