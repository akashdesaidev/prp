import express from 'express';
import {
  createOKR,
  getOKRs,
  getOKR,
  updateOKR,
  deleteOKR,
  updateKeyResult,
  addKeyResult
} from '../controllers/okrController.js';
import auth from '../middleware/auth.js';
import rbac from '../middleware/rbac.js';

const router = express.Router();

// All routes require authentication
router.use(auth);

// OKR routes
router.post('/', rbac(['admin', 'hr', 'manager']), createOKR);
router.get('/', getOKRs);
router.get('/:id', getOKR);
router.patch('/:id', updateOKR);
router.delete('/:id', rbac(['admin']), deleteOKR);

// Key Result routes
router.post('/:okrId/key-results', addKeyResult);
router.patch('/:okrId/key-results/:keyResultId', updateKeyResult);

export default router;
