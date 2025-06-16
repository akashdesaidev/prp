import express from 'express';
import auth from '../middleware/auth.js';
import rbac from '../middleware/rbac.js';
import {
  generateReviewSuggestion,
  summarizeSelfAssessment,
  analyzeSentiment,
  calculateAIScore,
  testAIConnection,
  handleChatbotQuery
} from '../controllers/aiController.js';
import { body } from 'express-validator';

const router = express.Router();

// All routes require authentication
router.use(auth);

// Validation middleware
const reviewSuggestionValidation = [
  body('reviewData').isObject().withMessage('Review data must be an object')
];

const sentimentAnalysisValidation = [
  body('text').isString().isLength({ min: 1 }).withMessage('Text is required')
];

const chatbotValidation = [
  body('message').isString().isLength({ min: 1 }).withMessage('Message is required'),
  body('context').optional().isObject().withMessage('Context must be an object'),
  body('conversationHistory')
    .optional()
    .isArray()
    .withMessage('Conversation history must be an array')
];

// @route   POST /api/ai/review-suggestion
// @desc    Generate AI-powered review suggestion
// @access  Private
router.post('/review-suggestion', reviewSuggestionValidation, generateReviewSuggestion);

// @route   POST /api/ai/summarize-assessment
// @desc    Summarize self-assessment using AI
// @access  All authenticated users
router.post('/summarize-assessment', summarizeSelfAssessment);

// @route   POST /api/ai/sentiment-analysis
// @desc    Analyze sentiment of text
// @access  Private
router.post('/sentiment-analysis', sentimentAnalysisValidation, analyzeSentiment);

// @route   GET /api/ai/score/:userId/:reviewCycleId?
// @desc    Calculate AI score for user
// @access  Admin, HR, Manager (for their reports)
router.get('/score/:userId/:reviewCycleId?', rbac(['admin', 'hr', 'manager']), calculateAIScore);

// @route   GET /api/ai/test-connection
// @desc    Test AI service connection
// @access  Admin only
router.get('/test-connection', rbac(['admin']), testAIConnection);

// @route   POST /api/ai/chatbot
// @desc    Handle chatbot queries for product guidance
// @access  Private
router.post('/chatbot', chatbotValidation, handleChatbotQuery);

export default router;
