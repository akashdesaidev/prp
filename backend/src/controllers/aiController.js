import { z } from 'zod';
import aiService from '../services/aiService.js';
import ReviewSubmission from '../models/ReviewSubmission.js';
import Feedback from '../models/Feedback.js';
import OKR from '../models/OKR.js';
import User from '../models/User.js';

// Validation schemas
const reviewSuggestionSchema = z.object({
  revieweeId: z.string(),
  reviewType: z.enum(['self', 'peer', 'manager', 'upward']),
  includeOKRData: z.boolean().optional(),
  includeFeedbackData: z.boolean().optional()
});

const selfAssessmentSummarySchema = z.object({
  responses: z.array(
    z.object({
      question: z.string(),
      response: z.string()
    })
  )
});

const sentimentAnalysisSchema = z.object({
  text: z.string().min(1)
});

// Generate review suggestion
export const generateReviewSuggestion = async (req, res) => {
  try {
    const parsed = reviewSuggestionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parsed.error.flatten()
      });
    }

    const {
      revieweeId,
      reviewType,
      includeOKRData = true,
      includeFeedbackData = true
    } = parsed.data;

    // Get reviewee information
    const reviewee = await User.findById(revieweeId).select('firstName lastName email');
    if (!reviewee) {
      return res.status(404).json({
        success: false,
        message: 'Reviewee not found'
      });
    }

    // Gather data for AI suggestion
    let pastFeedback = '';
    let okrProgress = '';

    if (includeFeedbackData) {
      // Get recent feedback for the reviewee
      const recentFeedback = await Feedback.find({
        toUserId: revieweeId,
        createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } // Last 90 days
      })
        .populate('fromUserId', 'firstName lastName')
        .limit(5)
        .sort({ createdAt: -1 });

      if (recentFeedback.length > 0) {
        pastFeedback = recentFeedback
          .map((f) => `From ${f.fromUserId.firstName} ${f.fromUserId.lastName}: ${f.content}`)
          .join('\n');
      }
    }

    if (includeOKRData) {
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
    }

    // Generate AI suggestion
    const reviewData = {
      revieweeName: `${reviewee.firstName} ${reviewee.lastName}`,
      reviewType,
      pastFeedback,
      okrProgress
    };

    const aiResult = await aiService.generateReviewSuggestion(reviewData);

    if (!aiResult.success) {
      return res.status(503).json({
        success: false,
        message: aiResult.error
      });
    }

    res.json({
      success: true,
      data: {
        suggestion: aiResult.suggestion,
        provider: aiResult.provider,
        revieweeId,
        reviewType
      }
    });
  } catch (error) {
    console.error('Error generating review suggestion:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate review suggestion',
      error: error.message
    });
  }
};

// Summarize self-assessment
export const summarizeSelfAssessment = async (req, res) => {
  try {
    const parsed = selfAssessmentSummarySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parsed.error.flatten()
      });
    }

    const { responses } = parsed.data;

    // Generate AI summary
    const aiResult = await aiService.summarizeSelfAssessment({ responses });

    if (!aiResult.success) {
      return res.status(503).json({
        success: false,
        message: aiResult.error
      });
    }

    res.json({
      success: true,
      data: {
        summary: aiResult.summary,
        provider: aiResult.provider
      }
    });
  } catch (error) {
    console.error('Error summarizing self-assessment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to summarize self-assessment',
      error: error.message
    });
  }
};

// Analyze sentiment
export const analyzeSentiment = async (req, res) => {
  try {
    const parsed = sentimentAnalysisSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: parsed.error.flatten()
      });
    }

    const { text } = parsed.data;

    // Generate AI sentiment analysis
    const aiResult = await aiService.analyzeSentiment(text);

    if (!aiResult.success) {
      return res.status(503).json({
        success: false,
        message: aiResult.error
      });
    }

    res.json({
      success: true,
      data: {
        sentiment: aiResult.sentiment,
        qualityFlags: aiResult.qualityFlags,
        provider: aiResult.provider
      }
    });
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze sentiment',
      error: error.message
    });
  }
};

// Calculate AI score
export const calculateAIScore = async (req, res) => {
  try {
    const { userId, reviewCycleId } = req.params;

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate score components
    const components = {};

    // Recent feedback score (last 90 days)
    const recentFeedback = await Feedback.find({
      toUserId: userId,
      rating: { $exists: true },
      createdAt: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }
    });

    if (recentFeedback.length > 0) {
      components.recentFeedbackScore =
        recentFeedback.reduce((sum, f) => sum + f.rating, 0) / recentFeedback.length;
    }

    // OKR score (current active OKRs)
    const activeOKRs = await OKR.find({
      assignedTo: userId,
      status: 'active'
    });

    if (activeOKRs.length > 0) {
      const totalOKRScore = activeOKRs.reduce((sum, okr) => {
        const okrScore =
          okr.keyResults.length > 0
            ? okr.keyResults.reduce((krSum, kr) => krSum + (kr.score || 1), 0) /
              okr.keyResults.length
            : 1;
        return sum + okrScore;
      }, 0);
      components.okrScore = totalOKRScore / activeOKRs.length;
    }

    // Peer feedback score (from review cycle)
    if (reviewCycleId) {
      const peerReviews = await ReviewSubmission.find({
        revieweeId: userId,
        reviewCycleId,
        reviewType: 'peer',
        status: 'submitted',
        overallRating: { $exists: true }
      });

      if (peerReviews.length > 0) {
        components.peerFeedbackScore =
          peerReviews.reduce((sum, r) => sum + r.overallRating, 0) / peerReviews.length;
      }

      // Manager feedback score
      const managerReviews = await ReviewSubmission.find({
        revieweeId: userId,
        reviewCycleId,
        reviewType: 'manager',
        status: 'submitted',
        overallRating: { $exists: true }
      });

      if (managerReviews.length > 0) {
        components.managerFeedbackScore =
          managerReviews.reduce((sum, r) => sum + r.overallRating, 0) / managerReviews.length;
      }

      // Self-assessment score
      const selfReview = await ReviewSubmission.findOne({
        revieweeId: userId,
        reviewCycleId,
        reviewType: 'self',
        status: 'submitted',
        overallRating: { $exists: true }
      });

      if (selfReview) {
        components.selfAssessmentScore = selfReview.overallRating;
      }
    }

    // Tenure adjustment (simple calculation based on creation date)
    const tenureMonths = Math.floor(
      (Date.now() - user.createdAt.getTime()) / (30 * 24 * 60 * 60 * 1000)
    );
    components.tenureAdjustmentScore = Math.min(tenureMonths / 12, 1) * 2; // Max 2 points for 1+ year tenure

    // Calculate final AI score
    const finalScore = aiService.calculateAIScore(components);

    res.json({
      success: true,
      data: {
        userId,
        reviewCycleId,
        components,
        finalScore,
        calculatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error calculating AI score:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate AI score',
      error: error.message
    });
  }
};

// Test AI connection
export const testAIConnection = async (req, res) => {
  try {
    const result = await aiService.testConnection();

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error testing AI connection:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test AI connection',
      error: error.message
    });
  }
};
