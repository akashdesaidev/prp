import ReviewCycle from '../models/ReviewCycle.js';
import User from '../models/User.js';
import { validationResult } from 'express-validator';

// Get all review cycles with filtering and pagination
export const getReviewCycles = async (req, res) => {
  try {
    const { status, type, page = 1, limit = 10 } = req.query;

    const query = {};
    if (status && status !== 'all') query.status = status;
    if (type && type !== 'all') query.type = type;

    console.log('Query filters:', { status, type, query });

    // Simplified query - just get the data without complex operations first
    const reviewCycles = await ReviewCycle.find(query);
    console.log('Found review cycles (before pagination):', reviewCycles.length);

    // Apply pagination manually
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedCycles = reviewCycles.slice(startIndex, endIndex);

    console.log('Paginated cycles:', paginatedCycles.length);

    const total = reviewCycles.length;

    res.json({
      success: true,
      data: paginatedCycles,
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

    res.json({
      success: true,
      data: reviewCycle
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
      questions: questions || [],
      createdBy: req.user.id,
      isEmergency: isEmergency || false
    });

    await reviewCycle.save();

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
      'questions'
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

    // Update allowed fields
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        reviewCycle[field] = req.body[field];
      }
    });

    await reviewCycle.save();

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
