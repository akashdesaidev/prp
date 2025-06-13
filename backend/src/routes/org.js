import express from 'express';
import { getOrgTree } from '../controllers/orgController.js';
import auth from '../middleware/auth.js';
import rbac from '../middleware/rbac.js';

const router = express.Router();

router.get('/tree', auth, rbac(['admin', 'hr', 'manager']), getOrgTree);

export default router;
