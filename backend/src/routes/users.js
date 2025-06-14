import { Router } from 'express';
import auth from '../middleware/auth.js';
import rbac from '../middleware/rbac.js';
import {
  createUser,
  listUsers,
  getUser,
  updateUser,
  deleteUser,
  listDirectReports,
  bulkImportUsers,
  updateUserRelations,
  updateUserRole
} from '../controllers/userController.js';

const router = Router();

router.use(auth);
router.get('/', rbac(['admin', 'hr', 'manager']), listUsers);
router.post('/', rbac(['admin', 'hr']), createUser);
router.get('/:id', rbac(['admin', 'hr', 'manager']), getUser);
router.patch('/:id', rbac(['admin', 'hr']), updateUser);
router.patch('/:id/manager', rbac(['admin', 'hr', 'manager']), updateUserRelations);
router.patch('/:id/role', rbac(['admin', 'hr']), updateUserRole);
router.delete('/:id', rbac(['admin']), deleteUser);

// Manager reports
router.get('/:id/reports', rbac(['admin', 'hr', 'manager']), listDirectReports);

// Bulk import
router.post('/bulk', rbac(['admin', 'hr']), bulkImportUsers);

export default router;
