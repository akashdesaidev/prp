import { Router } from 'express';
import auth from '../middleware/auth.js';
import rbac from '../middleware/rbac.js';
import { createUser, listUsers, getUser, updateUser, deleteUser } from '../controllers/userController.js';

const router = Router();

router.use(auth);
router.get('/', rbac(['admin', 'hr']), listUsers);
router.post('/', rbac(['admin', 'hr']), createUser);
router.get('/:id', rbac(['admin', 'hr', 'manager']), getUser);
router.patch('/:id', rbac(['admin', 'hr']), updateUser);
router.delete('/:id', rbac(['admin']), deleteUser);

export default router;
