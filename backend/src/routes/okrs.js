import express from 'express';
import {
  createOKR,
  getOKRs,
  getOKR,
  updateOKR,
  deleteOKR,
  updateKeyResult,
  addKeyResult,
  getOKRTags,
  updateProgress,
  getProgressHistory,
  getOKRHierarchy
} from '../controllers/okrController.js';
import auth from '../middleware/auth.js';
import rbac from '../middleware/rbac.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// OKR routes - specific routes MUST come before generic /:id routes
router.post('/', rbac(['admin', 'hr', 'manager']), createOKR);
router.get('/', getOKRs);
router.get('/hierarchy', getOKRHierarchy); // Hierarchy endpoint
router.get('/tags', getOKRTags);
router.put('/:id/progress', updateProgress); // Specific route first
router.get('/:id/progress-history', getProgressHistory); // Specific route first
router.get('/:id', getOKR); // Generic route after specific ones
router.patch('/:id', updateOKR);
router.delete('/:id', rbac(['admin']), deleteOKR);

// Key Result routes
router.post('/:okrId/key-results', addKeyResult);
router.patch('/:okrId/key-results/:keyResultId', updateKeyResult);

export default router;
