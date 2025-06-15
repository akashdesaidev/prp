import { Router } from 'express';
import { login, register, refresh, getMe } from '../controllers/authController.js';
import auth from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.get('/me', auth, getMe);

export default router;
