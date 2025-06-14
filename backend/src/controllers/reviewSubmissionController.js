import ReviewSubmission from '../models/ReviewSubmission.js';
import ReviewCycle from '../models/ReviewCycle.js';
import mongoose from 'mongoose';
import { validationResult } from 'express-validator';

// Get user's review submissions
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
      .populate('reviewCycleId', 'name type status endDate')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: submissions
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

    res.json({
      success: true,
      data: submission
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
      'comments'
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        submission[field] = req.body[field];
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
          reviewCycleId: mongoose.Types.ObjectId(reviewCycleId)
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
