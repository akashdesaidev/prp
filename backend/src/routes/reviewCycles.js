import express from 'express';
import { body, param, query } from 'express-validator';
import auth from '../middleware/auth.js';
import rbac from '../middleware/rbac.js';
import * as reviewCycleController from '../controllers/reviewCycleController.js';

const router = express.Router();

// Validation middleware
const createReviewCycleValidation = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Name must be between 3 and 100 characters'),
  body('type')
    .isIn(['quarterly', 'half-yearly', 'annual', 'custom'])
    .withMessage('Invalid review cycle type'),
  body('startDate').isISO8601().withMessage('Start date must be a valid date'),
  body('endDate').isISO8601().withMessage('End date must be a valid date'),
  body('gracePeriodDays')
    .optional()
    .isInt({ min: 0, max: 30 })
    .withMessage('Grace period must be between 0 and 30 days'),
  body('minPeerReviewers')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Minimum peer reviewers must be between 1 and 10'),
  body('maxPeerReviewers')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Maximum peer reviewers must be between 1 and 20')
];

const updateReviewCycleValidation = [
  body('name')
    .optional()
    .isLength({ min: 3, max: 100 })
    .withMessage('Name must be between 3 and 100 characters'),
  body('endDate').optional().isISO8601().withMessage('End date must be a valid date'),
  body('gracePeriodDays')
    .optional()
    .isInt({ min: 0, max: 30 })
    .withMessage('Grace period must be between 0 and 30 days'),
  body('status')
    .optional()
    .isIn(['draft', 'active', 'grace-period', 'closed'])
    .withMessage('Invalid status')
];

const idValidation = [param('id').isMongoId().withMessage('Invalid review cycle ID')];

// @route   GET /api/v1/review-cycles
// @desc    Get all review cycles with filtering
// @access  Admin, HR, Manager
router.get(
  '/',
  auth,
  rbac(['admin', 'hr', 'manager']),
  [
    query('status').optional().isIn(['all', 'draft', 'active', 'grace-period', 'closed']),
    query('type').optional().isIn(['all', 'quarterly', 'half-yearly', 'annual', 'custom']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  reviewCycleController.getReviewCycles
);

// @route   GET /api/v1/review-cycles/my-active
// @desc    Get user's active review cycles
// @access  All authenticated users
router.get('/my-active', auth, reviewCycleController.getUserActiveReviewCycles);

// @route   GET /api/v1/review-cycles/stats
// @desc    Get general review cycle statistics
// @access  Admin, HR, Manager
router.get('/stats', auth, rbac(['admin', 'hr', 'manager']), reviewCycleController.getGeneralStats);

// @route   GET /api/v1/review-cycles/debug
// @desc    Debug endpoint to check raw data
// @access  Admin, HR, Manager
router.get(
  '/debug',
  auth,
  rbac(['admin', 'hr', 'manager']),
  reviewCycleController.debugReviewCycles
);

// @route   GET /api/v1/review-cycles/:id
// @desc    Get single review cycle
// @access  Admin, HR, Manager, or participants
router.get('/:id', auth, idValidation, reviewCycleController.getReviewCycle);

// @route   POST /api/v1/review-cycles
// @desc    Create new review cycle
// @access  Admin, HR
router.post(
  '/',
  auth,
  rbac(['admin', 'hr']),
  createReviewCycleValidation,
  reviewCycleController.createReviewCycle
);

// @route   PUT /api/v1/review-cycles/:id
// @desc    Update review cycle
// @access  Admin, HR
router.put(
  '/:id',
  auth,
  rbac(['admin', 'hr']),
  idValidation,
  updateReviewCycleValidation,
  reviewCycleController.updateReviewCycle
);

// @route   DELETE /api/v1/review-cycles/:id
// @desc    Delete review cycle (soft delete)
// @access  Admin only
router.delete('/:id', auth, rbac(['admin']), idValidation, reviewCycleController.deleteReviewCycle);

// @route   POST /api/v1/review-cycles/:id/participants
// @desc    Assign participants to review cycle
// @access  Admin, HR
router.post(
  '/:id/participants',
  auth,
  rbac(['admin', 'hr']),
  idValidation,
  [
    body('userIds')
      .isArray({ min: 1 })
      .withMessage('User IDs array is required')
      .custom((userIds) => {
        if (!userIds.every((id) => typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/))) {
          throw new Error('All user IDs must be valid MongoDB ObjectIds');
        }
        return true;
      })
  ],
  reviewCycleController.assignParticipants
);

// @route   GET /api/v1/review-cycles/:id/stats
// @desc    Get review cycle statistics
// @access  Admin, HR
router.get(
  '/:id/stats',
  auth,
  rbac(['admin', 'hr']),
  idValidation,
  reviewCycleController.getReviewCycleStats
);

export default router;
