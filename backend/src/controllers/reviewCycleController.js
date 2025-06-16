import ReviewCycle from '../models/ReviewCycle.js';
import ReviewSubmission from '../models/ReviewSubmission.js';
import User from '../models/User.js';
import notificationService from '../services/notificationService.js';
import aiService from '../services/aiService.js';
import Feedback from '../models/Feedback.js';
import OKR from '../models/OKR.js';
import { validationResult } from 'express-validator';

// Helper function to generate AI suggestions for manager reviews
const generateAISuggestionForManager = async (
  revieweeId,
  reviewCycleId,
  reviewType = 'manager'
) => {
  try {
    // Get reviewee information
    const reviewee = await User.findById(revieweeId).select('firstName lastName email');
    if (!reviewee) return null;

    // Get review cycle with questions
    const reviewCycle = await ReviewCycle.findById(reviewCycleId);
    if (!reviewCycle || !reviewCycle.questions) return null;

    // Gather data for AI suggestion
    let pastFeedback = '';
    let okrProgress = '';

    // Get recent feedback for the reviewee (last 90 days)
    const recentFeedback = await Feedback.find({
      toUserId: revieweeId,
      createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
    })
      .populate('fromUserId', 'firstName lastName')
      .limit(5)
      .sort({ createdAt: -1 });

    if (recentFeedback.length > 0) {
      pastFeedback = recentFeedback
        .map((f) => `From ${f.fromUserId.firstName} ${f.fromUserId.lastName}: ${f.content}`)
        .join('\n');
    }

    // Get current OKRs and progress
    const currentOKRs = await OKR.find({
      assignedTo: revieweeId,
      status: 'active'
    }).limit(3);

    if (currentOKRs.length > 0) {
      okrProgress = currentOKRs
        .map((okr) => {
          const progress =
            okr.keyResults.length > 0
              ? Math.round(
                  (okr.keyResults.reduce((sum, kr) => sum + (kr.score || 1), 0) /
                    (okr.keyResults.length * 10)) *
                    100
                )
              : 0;
          return `${okr.title}: ${progress}% complete`;
        })
        .join('\n');
    }

    // Generate AI suggestions for each question
    const questionResponses = [];

    for (const question of reviewCycle.questions) {
      const reviewData = {
        revieweeName: `${reviewee.firstName} ${reviewee.lastName}`,
        reviewType,
        pastFeedback,
        okrProgress,
        question: question.question,
        requiresRating: question.requiresRating
      };

      const aiResult = await aiService.generateQuestionResponse(reviewData);

      if (aiResult.success) {
        questionResponses.push({
          questionId: question._id,
          questionText: question.question,
          response: aiResult.response,
          rating: question.requiresRating ? aiResult.rating : null
        });
      } else {
        // Fallback response if AI fails
        questionResponses.push({
          questionId: question._id,
          questionText: question.question,
          response: `Based on ${reviewee.firstName}'s recent performance and feedback, they have shown consistent progress in their role.`,
          rating: question.requiresRating ? 7 : null
        });
      }
    }

    // Also generate general comments
    const generalReviewData = {
      revieweeName: `${reviewee.firstName} ${reviewee.lastName}`,
      reviewType,
      pastFeedback,
      okrProgress
    };

    const generalAiResult = await aiService.generateReviewSuggestion(generalReviewData);

    return {
      suggestedComments: generalAiResult.success
        ? generalAiResult.suggestion
        : `${reviewee.firstName} has demonstrated solid performance this review period.`,
      suggestedResponses: questionResponses,
      usedSuggestion: false
    };
  } catch (error) {
    console.error('Error generating AI suggestion:', error);
    return null;
  }
};

// Helper function to create review submissions for participants
const createReviewSubmissionsForCycle = async (reviewCycle) => {
  try {
    console.log(`🔄 Creating review submissions for cycle: ${reviewCycle.name}`);

    const submissions = [];

    for (const participant of reviewCycle.participants) {
      const userId = participant.userId;

      // Create self-assessment submission
      const existingSelfReview = await ReviewSubmission.findOne({
        reviewCycleId: reviewCycle._id,
        revieweeId: userId,
        reviewerId: userId,
        reviewType: 'self'
      });

      if (!existingSelfReview) {
        const selfSubmission = new ReviewSubmission({
          reviewCycleId: reviewCycle._id,
          revieweeId: userId,
          reviewerId: userId,
          reviewType: 'self',
          status: 'draft',
          responses: []
        });

        await selfSubmission.save();
        submissions.push(selfSubmission);
        console.log(`✅ Created self-assessment for user ${userId}`);
      }

      // Create manager review submission (if user has a manager)
      const user = await User.findById(userId).populate('managerId');
      if (user && user.managerId) {
        const existingManagerReview = await ReviewSubmission.findOne({
          reviewCycleId: reviewCycle._id,
          revieweeId: userId,
          reviewerId: user.managerId._id,
          reviewType: 'manager'
        });

        if (!existingManagerReview) {
          // Generate AI suggestion for manager review
          console.log(`🤖 Generating AI suggestion for manager review: ${userId}`);
          const aiSuggestion = await generateAISuggestionForManager(
            userId,
            reviewCycle._id,
            'manager'
          );

          const managerSubmission = new ReviewSubmission({
            reviewCycleId: reviewCycle._id,
            revieweeId: userId,
            reviewerId: user.managerId._id,
            reviewType: 'manager',
            status: 'draft',
            responses: aiSuggestion?.suggestedResponses || [],
            aiSuggestions: aiSuggestion || {
              suggestedComments: '',
              usedSuggestion: false
            }
          });

          await managerSubmission.save();
          submissions.push(managerSubmission);
          console.log(
            `✅ Created manager review for user ${userId} (manager: ${user.managerId._id})${aiSuggestion ? ' with AI suggestion' : ''}`
          );
        }
      }
    }

    console.log(
      `🎉 Created ${submissions.length} review submissions for cycle ${reviewCycle.name}`
    );
    return submissions;
  } catch (error) {
    console.error('Error creating review submissions:', error);
    throw error;
  }
};

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

    // Prepare questions with defaults if empty
    const defaultQuestions = [
      {
        category: 'skills',
        question: "How would you rate this person's technical skills and competencies?",
        requiresRating: true,
        ratingScale: 10,
        isRequired: true,
        order: 1
      },
      {
        category: 'values',
        question: 'How well does this person demonstrate company values and culture?',
        requiresRating: true,
        ratingScale: 10,
        isRequired: true,
        order: 2
      },
      {
        category: 'overall',
        question: 'Please provide specific examples of achievements and areas for improvement.',
        requiresRating: false,
        isRequired: true,
        order: 3
      }
    ];

    const finalQuestions =
      questions && questions.length > 0
        ? questions.map((q, index) => ({
            category: q.category || 'skills',
            question: q.question || q.text || q.title || 'No question provided',
            requiresRating: q.requiresRating !== undefined ? q.requiresRating : true,
            ratingScale: q.ratingScale || 10,
            isRequired: q.isRequired !== undefined ? q.isRequired : true,
            order: q.order || index + 1
          }))
        : defaultQuestions;

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
      questions: finalQuestions,
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

    // Update allowed fields
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        reviewCycle[field] = req.body[field];
      }
    });

    // Check if status is changing to 'active' and create review submissions
    const wasStatusChanged = req.body.status && req.body.status !== reviewCycle.status;
    const isBecomingActive = req.body.status === 'active';

    await reviewCycle.save();

    // Create review submissions when cycle becomes active
    if (wasStatusChanged && isBecomingActive) {
      try {
        await createReviewSubmissionsForCycle(reviewCycle);
      } catch (error) {
        console.error('Error creating review submissions:', error);
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

    // Create review submissions for newly assigned participants if cycle is active
    if (reviewCycle.status === 'active') {
      try {
        await createReviewSubmissionsForCycle(reviewCycle);
      } catch (error) {
        console.error('Error creating review submissions:', error);
        // Don't fail the assignment if submission creation fails
      }
    }

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

// Remove participant from review cycle
export const removeParticipant = async (req, res) => {
  try {
    const { id: reviewCycleId, userId } = req.params;

    const reviewCycle = await ReviewCycle.findById(reviewCycleId);
    if (!reviewCycle) {
      return res.status(404).json({
        success: false,
        message: 'Review cycle not found'
      });
    }

    // Find and remove the participant
    const participantIndex = reviewCycle.participants.findIndex(
      (p) => p.userId.toString() === userId
    );

    if (participantIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found in this review cycle'
      });
    }

    // Remove the participant
    reviewCycle.participants.splice(participantIndex, 1);
    await reviewCycle.save();

    // Optionally, remove related review submissions
    try {
      await ReviewSubmission.deleteMany({
        reviewCycleId: reviewCycleId,
        $or: [{ revieweeId: userId }, { reviewerId: userId }]
      });
      console.log(`Removed review submissions for user ${userId} in cycle ${reviewCycleId}`);
    } catch (error) {
      console.error('Error removing review submissions:', error);
      // Don't fail the removal if submission cleanup fails
    }

    res.json({
      success: true,
      message: 'Participant removed successfully'
    });
  } catch (error) {
    console.error('Error removing participant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove participant',
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

// Generate review submissions for active cycles (manual trigger)
export const generateReviewSubmissions = async (req, res) => {
  try {
    const reviewCycleId = req.params.id;

    const reviewCycle = await ReviewCycle.findById(reviewCycleId);
    if (!reviewCycle) {
      return res.status(404).json({
        success: false,
        message: 'Review cycle not found'
      });
    }

    if (reviewCycle.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Can only generate submissions for active review cycles'
      });
    }

    const submissions = await createReviewSubmissionsForCycle(reviewCycle);

    res.json({
      success: true,
      message: `Generated ${submissions.length} review submissions`,
      data: {
        reviewCycleId: reviewCycle._id,
        reviewCycleName: reviewCycle.name,
        submissionsCreated: submissions.length
      }
    });
  } catch (error) {
    console.error('Error generating review submissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate review submissions',
      error: error.message
    });
  }
};
