import express from 'express';
import { body, param, query } from 'express-validator';
import auth from '../middleware/auth.js';
import rbac from '../middleware/rbac.js';
import * as feedbackController from '../controllers/feedbackController.js';

const router = express.Router();

// Validation middleware
const createFeedbackValidation = [
  body('toUserId').isMongoId().withMessage('Recipient user ID must be a valid MongoDB ObjectId'),
  body('content')
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Content must be between 10 and 2000 characters'),
  body('rating')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Rating must be between 1 and 10'),
  body('type')
    .optional()
    .isIn(['public', 'private'])
    .withMessage('Type must be either public or private'),
  body('category')
    .optional()
    .isIn(['skills', 'values', 'initiatives', 'goals', 'collaboration', 'leadership'])
    .withMessage('Invalid category'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be between 1 and 50 characters'),
  body('isAnonymous').optional().isBoolean().withMessage('isAnonymous must be a boolean'),
  body('reviewCycleId')
    .optional()
    .isMongoId()
    .withMessage('Review cycle ID must be a valid MongoDB ObjectId')
];

const updateFeedbackValidation = [
  body('content')
    .optional()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Content must be between 10 and 2000 characters'),
  body('rating')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Rating must be between 1 and 10'),
  body('type')
    .optional()
    .isIn(['public', 'private'])
    .withMessage('Type must be either public or private'),
  body('category')
    .optional()
    .isIn(['skills', 'values', 'initiatives', 'goals', 'collaboration', 'leadership'])
    .withMessage('Invalid category'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be between 1 and 50 characters')
];

const idValidation = [param('id').isMongoId().withMessage('Invalid feedback ID')];

// @route   GET /api/v1/feedback/received
// @desc    Get feedback received by user
// @access  All authenticated users
router.get(
  '/received',
  auth,
  [
    query('userId').optional().isMongoId().withMessage('Invalid user ID'),
    query('type').optional().isIn(['public', 'private']),
    query('category')
      .optional()
      .isIn(['skills', 'values', 'initiatives', 'goals', 'collaboration', 'leadership']),
    query('reviewCycleId').optional().isMongoId().withMessage('Invalid review cycle ID'),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  feedbackController.getFeedbackForUser
);

// @route   GET /api/v1/feedback/given
// @desc    Get feedback given by user
// @access  All authenticated users
router.get(
  '/given',
  auth,
  [
    query('type').optional().isIn(['public', 'private']),
    query('category')
      .optional()
      .isIn(['skills', 'values', 'initiatives', 'goals', 'collaboration', 'leadership']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  feedbackController.getFeedbackByUser
);

// @route   GET /api/v1/feedback/stats
// @desc    Get feedback statistics for a user
// @access  All authenticated users (own stats) or Admin/HR
router.get(
  '/stats',
  auth,
  [
    query('userId').optional().isMongoId().withMessage('Invalid user ID'),
    query('timeRange').optional().isISO8601().withMessage('Invalid time range')
  ],
  feedbackController.getFeedbackStats
);

// @route   GET /api/v1/feedback (with summary=true)
// @desc    Get feedback summary for dashboard
// @access  All authenticated users
router.get(
  '/',
  auth,
  [
    query('summary').optional().isBoolean(),
    query('userId').optional().isMongoId().withMessage('Invalid user ID'),
    query('type').optional().isIn(['public', 'private']),
    query('category')
      .optional()
      .isIn(['skills', 'values', 'initiatives', 'goals', 'collaboration', 'leadership']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  async (req, res) => {
    // If summary=true, return simple count for dashboard
    if (req.query.summary === 'true') {
      try {
        const userId = req.user.id;
        const Feedback = require('../models/Feedback.js').default;
        const [receivedCount, givenCount] = await Promise.all([
          Feedback.countDocuments({
            toUserId: userId,
            status: 'active'
          }),
          Feedback.countDocuments({
            fromUserId: userId,
            status: 'active'
          })
        ]);
        return res.json({ count: receivedCount + givenCount });
      } catch (error) {
        return res.status(500).json({ error: 'Failed to get feedback count' });
      }
    }
    // Otherwise, get regular feedback list
    return feedbackController.getFeedbackForUser(req, res);
  }
);

// @route   GET /api/v1/feedback/analytics
// @desc    Get comprehensive feedback analytics for dashboard
// @access  Admin, HR, Manager, Employee
router.get(
  '/analytics',
  auth,
  [
    query('timeRange').optional().isString().withMessage('Time range must be a string'),
    query('category').optional().isString().withMessage('Category must be a string'),
    query('userId').optional().isMongoId().withMessage('Invalid user ID'),
    query('teamId').optional().isMongoId().withMessage('Invalid team ID'),
    query('departmentId').optional().isMongoId().withMessage('Invalid department ID')
  ],
  feedbackController.getFeedbackAnalytics
);

// @route   GET /api/v1/feedback/analytics/sentiment
// @desc    Get sentiment analysis for feedback
// @access  Admin, HR, Manager
router.get(
  '/analytics/sentiment',
  auth,
  rbac(['admin', 'hr', 'manager']),
  [
    query('timeRange').optional().isString().withMessage('Time range must be a string'),
    query('userId').optional().isMongoId().withMessage('Invalid user ID'),
    query('departmentId').optional().isMongoId().withMessage('Invalid department ID')
  ],
  feedbackController.getFeedbackSentimentAnalytics
);

// @route   GET /api/v1/feedback/moderation
// @desc    Get all feedback for moderation
// @access  Admin, HR only
router.get(
  '/moderation',
  auth,
  rbac(['admin', 'hr']),
  [
    query('status').optional().isIn(['active', 'hidden', 'flagged', 'deleted']),
    query('type').optional().isIn(['public', 'private']),
    query('flagged').optional().isBoolean(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  feedbackController.getAllFeedbackForModeration
);

// @route   GET /api/v1/feedback/:id
// @desc    Get single feedback
// @access  Feedback sender/receiver, Admin, HR
router.get('/:id', auth, idValidation, feedbackController.getFeedback);

// @route   POST /api/v1/feedback
// @desc    Create new feedback
// @access  All authenticated users
router.post('/', auth, createFeedbackValidation, feedbackController.createFeedback);

// @route   POST /api/v1/feedback/:id/analyze-sentiment
// @desc    Analyze sentiment for existing feedback
// @access  Admin, HR
router.post(
  '/:id/analyze-sentiment',
  auth,
  rbac(['admin', 'hr']),
  [param('id').isMongoId().withMessage('Invalid feedback ID')],
  feedbackController.analyzeFeedbackSentiment
);

// @route   PUT /api/v1/feedback/:id
// @desc    Update feedback
// @access  Feedback sender only
router.put('/:id', auth, idValidation, updateFeedbackValidation, feedbackController.updateFeedback);

// @route   POST /api/v1/feedback/:id/moderate
// @desc    Moderate feedback (hide/flag)
// @access  Admin, HR, Manager
router.post(
  '/:id/moderate',
  auth,
  rbac(['admin', 'hr', 'manager']),
  idValidation,
  [
    body('action')
      .isIn(['hide', 'restore'])
      .withMessage('Action must be either "hide" or "restore"'),
    body('reason')
      .optional()
      .isLength({ min: 10, max: 500 })
      .withMessage('Reason must be between 10 and 500 characters')
  ],
  feedbackController.moderateFeedback
);

// @route   GET /api/v1/feedback/analytics
// @desc    Get comprehensive feedback analytics for dashboard
// @access  Admin, HR, Manager, Employee
router.get(
  '/analytics',
  auth,
  [
    query('timeRange').optional().isString().withMessage('Time range must be a string'),
    query('category').optional().isString().withMessage('Category must be a string'),
    query('userId').optional().isMongoId().withMessage('Invalid user ID'),
    query('teamId').optional().isMongoId().withMessage('Invalid team ID')
  ],
  feedbackController.getFeedbackAnalytics
);

// @route   GET /api/v1/feedback/analytics/sentiment
// @desc    Get sentiment analysis for feedback
// @access  Admin, HR, Manager
router.get(
  '/analytics/sentiment',
  auth,
  rbac(['admin', 'hr', 'manager']),
  [
    query('timeRange').optional().isString().withMessage('Time range must be a string'),
    query('userId').optional().isMongoId().withMessage('Invalid user ID'),
    query('departmentId').optional().isMongoId().withMessage('Invalid department ID')
  ],
  feedbackController.getFeedbackSentimentAnalytics
);

export default router;
