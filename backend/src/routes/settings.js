import express from 'express';
import auth from '../middleware/auth.js';
import rbac from '../middleware/rbac.js';
import {
  getAISettings,
  updateAISettings,
  testAIConnection
} from '../controllers/settingsController.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(auth);
router.use(rbac(['admin']));

// @route   GET /api/settings/ai
// @desc    Get AI settings (masked)
// @access  Admin only
router.get('/ai', getAISettings);

// @route   PUT /api/settings/ai
// @desc    Update AI settings
// @access  Admin only
router.put('/ai', updateAISettings);

// @route   POST /api/settings/ai/test
// @desc    Test AI connection
// @access  Admin only
router.post('/ai/test', testAIConnection);

export default router;
