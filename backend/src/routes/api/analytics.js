import express from 'express';
import * as analyticsController from '../../controllers/analyticsController.js';
import auth from '../../middleware/auth.js';
import rbac from '../../middleware/rbac.js';

const router = express.Router();

// @route   GET /api/v1/analytics/dashboard
// @desc    Get analytics dashboard (alias for summary)
// @access  Admin, HR, Manager
router.get(
  '/dashboard',
  auth,
  rbac(['admin', 'hr', 'manager']),
  analyticsController.getAnalyticsSummary
);

// @route   GET /api/v1/analytics/summary
// @desc    Get analytics summary dashboard
// @access  Admin, HR, Manager
router.get(
  '/summary',
  auth,
  rbac(['admin', 'hr', 'manager']),
  analyticsController.getAnalyticsSummary
);

// @route   GET /api/v1/analytics/team
// @desc    Get team performance analytics
// @access  Admin, HR, Manager, Employee (with scope restrictions)
router.get('/team', auth, analyticsController.getTeamPerformanceAnalytics);

// @route   GET /api/v1/analytics/feedback
// @desc    Get feedback trend analytics
// @access  Admin, HR, Manager, Employee (with scope restrictions)
router.get('/feedback', auth, analyticsController.getFeedbackTrendAnalytics);

// @route   POST /api/v1/analytics/export
// @desc    Export analytics data
// @access  Admin, HR, Manager
router.post('/export', auth, rbac(['admin', 'hr', 'manager']), analyticsController.exportAnalytics);

export default router;
