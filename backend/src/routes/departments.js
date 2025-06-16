import express from 'express';
import {
  createDepartment,
  listDepartments,
  getDepartment,
  updateDepartment,
  deleteDepartment
} from '../controllers/departmentController.js';
import auth from '../middleware/auth.js';
import rbac from '../middleware/rbac.js';

const router = express.Router();

// Only admin or hr can manage departments
router.use(auth);

router.get('/', listDepartments);
router.post('/', rbac(['admin', 'hr']), createDepartment);
router.get('/:id', getDepartment);
router.put('/:id', rbac(['admin', 'hr']), updateDepartment);
router.patch('/:id', rbac(['admin', 'hr']), updateDepartment);
router.delete('/:id', rbac(['admin', 'hr']), deleteDepartment);

export default router;
