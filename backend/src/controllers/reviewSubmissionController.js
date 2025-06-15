import ReviewSubmission from '../models/ReviewSubmission.js';
import ReviewCycle from '../models/ReviewCycle.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import { validationResult } from 'express-validator';

// Auto-create review submissions for active cycles
export const createReviewSubmissionsForCycle = async (reviewCycleId) => {
  try {
    const cycle = await ReviewCycle.findById(reviewCycleId);
    if (!cycle) {
      throw new Error('Review cycle not found');
    }

    // Get all active users
    const users = await User.find({ isActive: true });
    const submissions = [];

    for (const user of users) {
      // Create self-review submission
      if (cycle.reviewTypes.selfReview) {
        const existingSelf = await ReviewSubmission.findOne({
          reviewCycleId,
          revieweeId: user._id,
          reviewerId: user._id,
          reviewType: 'self'
        });

        if (!existingSelf) {
          submissions.push({
            reviewCycleId,
            revieweeId: user._id,
            reviewerId: user._id,
            reviewType: 'self',
            status: 'draft',
            responses: cycle.questions.map((q) => ({
              questionId: q._id,
              questionText: q.question,
              response: '',
              rating: null
            }))
          });
        }
      }

      // Create manager review submission (if user has a manager)
      if (cycle.reviewTypes.managerReview && user.managerId) {
        const existingManager = await ReviewSubmission.findOne({
          reviewCycleId,
          revieweeId: user._id,
          reviewerId: user.managerId,
          reviewType: 'manager'
        });

        if (!existingManager) {
          submissions.push({
            reviewCycleId,
            revieweeId: user._id,
            reviewerId: user.managerId,
            reviewType: 'manager',
            status: 'draft',
            responses: cycle.questions.map((q) => ({
              questionId: q._id,
              questionText: q.question,
              response: '',
              rating: null
            }))
          });
        }
      }

      // Create upward review submission (if user has reports and upward reviews enabled)
      if (cycle.reviewTypes.upwardReview && user.managerId) {
        const existingUpward = await ReviewSubmission.findOne({
          reviewCycleId,
          revieweeId: user.managerId,
          reviewerId: user._id,
          reviewType: 'upward'
        });

        if (!existingUpward) {
          submissions.push({
            reviewCycleId,
            revieweeId: user.managerId,
            reviewerId: user._id,
            reviewType: 'upward',
            status: 'draft',
            responses: cycle.questions.map((q) => ({
              questionId: q._id,
              questionText: q.question,
              response: '',
              rating: null
            }))
          });
        }
      }
    }

    // Bulk create submissions
    if (submissions.length > 0) {
      await ReviewSubmission.insertMany(submissions);
      console.log(`Created ${submissions.length} review submissions for cycle ${reviewCycleId}`);
    }

    return submissions.length;
  } catch (error) {
    console.error('Error creating review submissions:', error);
    throw error;
  }
};

// Get user's review submissions (all reviews they need to complete)
export const getUserReviewSubmissions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { reviewCycleId, reviewType, status } = req.query;

    const query = { reviewerId: userId };
    if (reviewCycleId) query.reviewCycleId = reviewCycleId;
    if (reviewType) query.reviewType = reviewType;
    if (status) query.status = status;

    const submissions = await ReviewSubmission.find(query)
      .populate('revieweeId', 'firstName lastName email')
      .populate('reviewCycleId', 'name type status endDate questions')
      .sort({ createdAt: -1 });

    // Transform questions in all submissions for frontend compatibility
    const transformedSubmissions = submissions.map((submission) => ({
      ...submission.toObject(),
      reviewCycleId: submission.reviewCycleId
        ? {
            ...submission.reviewCycleId.toObject(),
            questions: submission.reviewCycleId.questions.map((q) => ({
              ...q.toObject(),
              type: q.requiresRating ? 'rating_text' : 'text',
              text: q.question
            }))
          }
        : null
    }));

    res.json({
      success: true,
      data: transformedSubmissions,
      reviews: transformedSubmissions // For backward compatibility
    });
  } catch (error) {
    console.error('Error fetching user review submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch review submissions',
      error: error.message
    });
  }
};

// Get user's review submissions with enhanced data (for my-reviews page)
export const getMyReviewSubmissions = async (req, res) => {
  try {
    const userId = req.user.id;

    // Also check for active cycles and auto-create missing submissions
    const activeCycles = await ReviewCycle.find({
      status: { $in: ['active', 'grace-period'] }
    });

    for (const cycle of activeCycles) {
      await createReviewSubmissionsForCycle(cycle._id);
    }

    // Get all review submissions where user is the reviewer (after auto-creation)
    const updatedSubmissions = await ReviewSubmission.find({ reviewerId: userId })
      .populate('revieweeId', 'firstName lastName email')
      .populate('reviewCycleId', 'name type status endDate questions')
      .sort({ createdAt: -1 });

    // Transform questions in all submissions for frontend compatibility
    const transformedSubmissions = updatedSubmissions.map((submission) => ({
      ...submission.toObject(),
      reviewCycleId: submission.reviewCycleId
        ? {
            ...submission.reviewCycleId.toObject(),
            questions: submission.reviewCycleId.questions.map((q) => ({
              ...q.toObject(),
              type: q.requiresRating ? 'rating_text' : 'text',
              text: q.question
            }))
          }
        : null
    }));

    res.json({
      success: true,
      data: transformedSubmissions,
      reviews: transformedSubmissions
    });
  } catch (error) {
    console.error('Error fetching my review submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch review submissions',
      error: error.message
    });
  }
};

// Get single review submission
export const getReviewSubmission = async (req, res) => {
  try {
    const submission = await ReviewSubmission.findById(req.params.id)
      .populate('revieweeId', 'firstName lastName email')
      .populate('reviewerId', 'firstName lastName email')
      .populate('reviewCycleId', 'name type status endDate questions');

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Review submission not found'
      });
    }

    // Check if user has permission to view this submission
    const userId = req.user.id;
    const hasPermission =
      submission.reviewerId.equals(userId) ||
      submission.revieweeId.equals(userId) ||
      ['admin', 'hr'].includes(req.user.role);

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Transform questions to include type field for frontend compatibility
    const transformedSubmission = {
      ...submission.toObject(),
      reviewCycleId: submission.reviewCycleId
        ? {
            ...submission.reviewCycleId.toObject(),
            questions: submission.reviewCycleId.questions.map((q) => ({
              ...q.toObject(),
              type: q.requiresRating ? 'rating_text' : 'text', // Add type field based on requiresRating
              text: q.question // Also map question field to text for frontend compatibility
            }))
          }
        : null
    };

    res.json({
      success: true,
      data: transformedSubmission
    });
  } catch (error) {
    console.error('Error fetching review submission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch review submission',
      error: error.message
    });
  }
};

// Update review submission
export const updateReviewSubmission = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const submission = await ReviewSubmission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Review submission not found'
      });
    }

    // Check if user owns this submission
    if (!submission.reviewerId.equals(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - can only edit your own reviews'
      });
    }

    // Check if submission can be edited
    if (submission.status === 'submitted') {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit submitted review'
      });
    }

    const allowedUpdates = [
      'responses',
      'overallRating',
      'strengths',
      'areasForImprovement',
      'goals',
      'comments',
      'status',
      'submittedAt'
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        // Handle special cases for numeric fields
        if (field === 'overallRating') {
          // Convert empty string or 0 to null for numeric fields (since ratings start from 1)
          submission[field] =
            req.body[field] === '' || req.body[field] === 0 ? null : req.body[field];
        } else if (field === 'responses' && Array.isArray(req.body[field])) {
          // Handle responses array with rating field conversion
          submission[field] = req.body[field].map((response) => ({
            ...response,
            rating: response.rating === '' || response.rating === 0 ? null : response.rating
          }));
        } else {
          submission[field] = req.body[field];
        }
      }
    });

    await submission.save();

    res.json({
      success: true,
      message: 'Review submission updated successfully',
      data: submission
    });
  } catch (error) {
    console.error('Error updating review submission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update review submission',
      error: error.message
    });
  }
};

// Submit review
export const submitReview = async (req, res) => {
  try {
    const submission = await ReviewSubmission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Review submission not found'
      });
    }

    // Check ownership
    if (!submission.reviewerId.equals(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Submit the review
    submission.status = 'submitted';
    submission.submittedAt = new Date();
    await submission.save();

    res.json({
      success: true,
      message: 'Review submitted successfully',
      data: submission
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit review',
      error: error.message
    });
  }
};

// Get pending reviews for user
export const getPendingReviews = async (req, res) => {
  try {
    const userId = req.user.id;

    const pendingReviews = await ReviewSubmission.find({
      reviewerId: userId,
      status: 'draft'
    })
      .populate('revieweeId', 'firstName lastName email')
      .populate('reviewCycleId', 'name endDate status')
      .sort({ 'reviewCycleId.endDate': 1 });

    res.json({
      success: true,
      data: pendingReviews
    });
  } catch (error) {
    console.error('Error fetching pending reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending reviews',
      error: error.message
    });
  }
};

// Nominate peers for review
export const nominatePeers = async (req, res) => {
  try {
    const { reviewCycleId, peerUserIds } = req.body;
    const userId = req.user.id;

    const reviewCycle = await ReviewCycle.findById(reviewCycleId);
    if (!reviewCycle) {
      return res.status(404).json({
        success: false,
        message: 'Review cycle not found'
      });
    }

    // Check if user is participant in this cycle
    const isParticipant = reviewCycle.participants.some((p) => p.userId.equals(userId));

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Not a participant in this review cycle'
      });
    }

    // Create peer review submissions
    const nominations = [];
    for (const peerUserId of peerUserIds) {
      // Check if peer review already exists
      const existingSubmission = await ReviewSubmission.findOne({
        reviewCycleId,
        revieweeId: userId,
        reviewerId: peerUserId,
        reviewType: 'peer'
      });

      if (!existingSubmission) {
        const submission = new ReviewSubmission({
          reviewCycleId,
          revieweeId: userId,
          reviewerId: peerUserId,
          reviewType: 'peer',
          isNominated: true,
          nominatedBy: userId,
          nominatedAt: new Date(),
          responses: reviewCycle.questions.map((q) => ({
            questionId: q._id,
            questionText: q.question,
            response: '',
            rating: null
          })),
          status: 'draft'
        });

        await submission.save();
        nominations.push({
          peerUserId,
          status: 'nominated'
        });
      } else {
        nominations.push({
          peerUserId,
          status: 'already_exists'
        });
      }
    }

    res.json({
      success: true,
      message: 'Peer nominations completed',
      data: nominations
    });
  } catch (error) {
    console.error('Error nominating peers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to nominate peers',
      error: error.message
    });
  }
};

// Get review analytics for admin/hr
export const getReviewAnalytics = async (req, res) => {
  try {
    const { reviewCycleId } = req.params;

    // Check permissions
    if (!['admin', 'hr'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const reviewCycle = await ReviewCycle.findById(reviewCycleId);
    if (!reviewCycle) {
      return res.status(404).json({
        success: false,
        message: 'Review cycle not found'
      });
    }

    // Get completion rates by review type
    const completionRates = await ReviewSubmission.aggregate([
      {
        $match: {
          reviewCycleId: new mongoose.Types.ObjectId(reviewCycleId)
        }
      },
      {
        $group: {
          _id: '$reviewType',
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'submitted'] }, 1, 0] }
          },
          averageRating: { $avg: '$overallRating' }
        }
      },
      {
        $project: {
          reviewType: '$_id',
          total: 1,
          completed: 1,
          completionRate: {
            $round: [{ $multiply: [{ $divide: ['$completed', '$total'] }, 100] }, 2]
          },
          averageRating: { $round: ['$averageRating', 2] }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        reviewCycle: {
          id: reviewCycle._id,
          name: reviewCycle.name,
          status: reviewCycle.status
        },
        completionRates
      }
    });
  } catch (error) {
    console.error('Error fetching review analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch review analytics',
      error: error.message
    });
  }
};

// Get nominations for a review cycle
export const getReviewCycleNominations = async (req, res) => {
  try {
    const reviewCycleId = req.query.reviewCycleId;
    const userId = req.user.id;

    // Check if review cycle exists
    const { default: ReviewCycle } = await import('../models/ReviewCycle.js');
    const reviewCycle = await ReviewCycle.findById(reviewCycleId);
    if (!reviewCycle) {
      return res.status(404).json({
        success: false,
        message: 'Review cycle not found'
      });
    }

    // Check if user is a participant in this cycle
    const isParticipant = reviewCycle.participants.some((p) => p.userId.equals(userId));
    if (!isParticipant && !['admin', 'hr'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view nominations for this review cycle'
      });
    }

    // Find nominations made by this user for this review cycle
    const nominations = await ReviewSubmission.find({
      reviewCycleId,
      nominatedBy: userId,
      reviewType: 'peer',
      isNominated: true
    })
      .populate('reviewerId', 'firstName lastName email department')
      .select('reviewerId nominatedAt status isNominated');

    // Transform the data to match frontend expectations
    const transformedNominations = nominations.map((nom) => ({
      userId: nom.reviewerId._id,
      user: nom.reviewerId,
      status: nom.status === 'submitted' ? 'submitted' : 'pending',
      nominatedAt: nom.nominatedAt,
      reason: '' // We don't store reason in ReviewSubmission model currently
    }));

    res.json({
      success: true,
      data: transformedNominations
    });
  } catch (error) {
    console.error('Error fetching review cycle nominations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nominations',
      error: error.message
    });
  }
};
