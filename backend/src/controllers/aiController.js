// Removed unused zod import
import aiService from '../services/aiService.js';
import ReviewSubmission from '../models/ReviewSubmission.js';
import Feedback from '../models/Feedback.js';
import OKR from '../models/OKR.js';
import User from '../models/User.js';
import { validationResult } from 'express-validator';

// Using express-validator for validation instead of Zod schemas

// Generate review suggestion
export const generateReviewSuggestion = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { reviewData } = req.body;
    const result = await aiService.generateReviewSuggestion(reviewData);

    if (!result.success) {
      return res.status(503).json({ error: result.error });
    }

    res.json(result);
  } catch (error) {
    console.error('AI suggestion error:', error);
    res.status(500).json({ error: 'Failed to generate suggestion' });
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { text } = req.body;
    const result = await aiService.analyzeSentiment(text);

    if (!result.success) {
      return res.status(503).json({ error: result.error });
    }

    res.json(result);
  } catch (error) {
    console.error('AI sentiment analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze sentiment' });
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

// New chatbot endpoint
export const handleChatbotQuery = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { message, context, conversationHistory = [] } = req.body;
    const userRole = req.user.role;
    const userName = `${req.user.firstName} ${req.user.lastName}`;

    // Create comprehensive context for the AI
    const chatContext = {
      ...context,
      userRole,
      userName,
      platform: 'Performance Review Platform',
      availableFeatures: getAvailableFeaturesForRole(userRole)
    };

    const result = await aiService.handleProductGuidance({
      message,
      context: chatContext,
      conversationHistory: conversationHistory.slice(-5) // Last 5 messages for context
    });

    if (!result.success) {
      return res.status(503).json({ error: result.error });
    }

    res.json({
      response: result.response,
      suggestions: result.suggestions || [],
      actions: result.actions || []
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ error: 'Failed to process chatbot query' });
  }
};

// Helper function to get available features based on user role
const getAvailableFeaturesForRole = (role) => {
  const features = {
    admin: [
      'User Management',
      'Organization Setup',
      'Review Cycle Management',
      'OKR Management',
      'Feedback Oversight',
      'AI Configuration',
      'System Settings',
      'Analytics & Reports',
      'Audit Logs'
    ],
    hr: [
      'User Lifecycle Management',
      'Role Assignments',
      'Organization Management',
      'Review Cycle Participation',
      'OKR Coordination',
      'Feedback Monitoring',
      'Analytics Access',
      'Export Permissions'
    ],
    manager: [
      'Team Management',
      'Review Cycles',
      'OKR Management',
      'Time Management',
      'Feedback Oversight',
      'AI Insights',
      'Team Analytics',
      'Approvals'
    ],
    employee: [
      'Self Reviews',
      'Peer Reviews',
      'Feedback',
      'OKRs',
      'Time Tracking',
      'AI Coaching',
      'Personal Analytics'
    ]
  };

  return features[role] || features.employee;
};

// All functions are exported individually above
