import express from 'express';
import { body, param, query } from 'express-validator';
import auth from '../middleware/auth.js';
import rbac from '../middleware/rbac.js';
import * as reviewSubmissionController from '../controllers/reviewSubmissionController.js';

const router = express.Router();

// Validation middleware
const updateSubmissionValidation = [
  body('responses').optional().isArray().withMessage('Responses must be an array'),
  body('responses.*.response').optional().isString().withMessage('Response must be a string'),
  body('responses.*.rating')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Rating must be between 1 and 10'),
  body('overallRating')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Overall rating must be between 1 and 10'),
  body('strengths')
    .optional()
    .isString()
    .isLength({ max: 2000 })
    .withMessage('Strengths must be a string with max 2000 characters'),
  body('areasForImprovement')
    .optional()
    .isString()
    .isLength({ max: 2000 })
    .withMessage('Areas for improvement must be a string with max 2000 characters'),
  body('goals')
    .optional()
    .isString()
    .isLength({ max: 2000 })
    .withMessage('Goals must be a string with max 2000 characters'),
  body('comments')
    .optional()
    .isString()
    .isLength({ max: 2000 })
    .withMessage('Comments must be a string with max 2000 characters')
];

const nominatePeersValidation = [
  body('reviewCycleId').isMongoId().withMessage('Review cycle ID must be a valid MongoDB ObjectId'),
  body('peerUserIds')
    .isArray({ min: 1 })
    .withMessage('Peer user IDs array is required')
    .custom((userIds) => {
      if (!userIds.every((id) => typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/))) {
        throw new Error('All peer user IDs must be valid MongoDB ObjectIds');
      }
      return true;
    })
];

const idValidation = [param('id').isMongoId().withMessage('Invalid submission ID')];

// @route   GET /api/v1/review-submissions/my-submissions
// @desc    Get user's review submissions
// @access  All authenticated users
router.get(
  '/my-submissions',
  auth,
  [
    query('reviewCycleId').optional().isMongoId().withMessage('Invalid review cycle ID'),
    query('reviewType').optional().isIn(['self', 'peer', 'manager', 'upward']),
    query('status').optional().isIn(['draft', 'submitted', 'reviewed'])
  ],
  reviewSubmissionController.getUserReviewSubmissions
);

// @route   GET /api/v1/review-submissions/pending
// @desc    Get user's pending reviews
// @access  All authenticated users
router.get('/pending', auth, reviewSubmissionController.getPendingReviews);

// @route   GET /api/v1/review-submissions/:id
// @desc    Get single review submission
// @access  Submission owner, reviewee, admin, hr
router.get('/:id', auth, idValidation, reviewSubmissionController.getReviewSubmission);

// @route   PUT /api/v1/review-submissions/:id
// @desc    Update review submission
// @access  Submission owner only
router.put(
  '/:id',
  auth,
  idValidation,
  updateSubmissionValidation,
  reviewSubmissionController.updateReviewSubmission
);

// @route   PATCH /api/v1/review-submissions/:id
// @desc    Update review submission (partial update)
// @access  Submission owner only
router.patch(
  '/:id',
  auth,
  idValidation,
  updateSubmissionValidation,
  reviewSubmissionController.updateReviewSubmission
);

// @route   POST /api/v1/review-submissions/:id/submit
// @desc    Submit review
// @access  Submission owner only
router.post('/:id/submit', auth, idValidation, reviewSubmissionController.submitReview);

// @route   POST /api/v1/review-submissions/nominate-peers
// @desc    Nominate peers for review
// @access  All authenticated users
router.post(
  '/nominate-peers',
  auth,
  nominatePeersValidation,
  reviewSubmissionController.nominatePeers
);

// @route   GET /api/v1/review-submissions/analytics/:reviewCycleId
// @desc    Get review analytics for a cycle
// @access  Admin, HR only
router.get(
  '/analytics/:reviewCycleId',
  auth,
  rbac(['admin', 'hr']),
  [param('reviewCycleId').isMongoId().withMessage('Invalid review cycle ID')],
  reviewSubmissionController.getReviewAnalytics
);

export default router;
