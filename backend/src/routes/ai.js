import express from 'express';
import auth from '../middleware/auth.js';
import rbac from '../middleware/rbac.js';
import {
  generateReviewSuggestion,
  summarizeSelfAssessment,
  analyzeSentiment,
  calculateAIScore,
  testAIConnection
} from '../controllers/aiController.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// @route   POST /api/ai/review-suggestion
// @desc    Generate AI review suggestion
// @access  All authenticated users
router.post('/review-suggestion', generateReviewSuggestion);

// @route   POST /api/ai/summarize-assessment
// @desc    Summarize self-assessment using AI
// @access  All authenticated users
router.post('/summarize-assessment', summarizeSelfAssessment);

// @route   POST /api/ai/analyze-sentiment
// @desc    Analyze sentiment of text
// @access  All authenticated users
router.post('/analyze-sentiment', analyzeSentiment);

// @route   GET /api/ai/score/:userId/:reviewCycleId?
// @desc    Calculate AI score for user
// @access  Admin, HR, Manager (for their reports)
router.get('/score/:userId/:reviewCycleId?', rbac(['admin', 'hr', 'manager']), calculateAIScore);

// @route   GET /api/ai/test-connection
// @desc    Test AI service connection
// @access  Admin only
router.get('/test-connection', rbac(['admin']), testAIConnection);

export default router;
