import { Router } from 'express';
import { login, register, refresh } from '../controllers/authController.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);

export default router;
