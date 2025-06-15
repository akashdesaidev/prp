import express from 'express';
import auth from '../middleware/auth.js';
import { getRecentActivity, getDashboardSummary } from '../controllers/dashboardController.js';

const router = express.Router();

// All dashboard routes require authentication
router.use(auth);

// @route   GET /api/dashboard/activity
// @desc    Get recent activity for dashboard
// @access  All authenticated users
router.get('/activity', getRecentActivity);

// @route   GET /api/dashboard/summary
// @desc    Get dashboard summary stats
// @access  All authenticated users
router.get('/summary', getDashboardSummary);

export default router;
