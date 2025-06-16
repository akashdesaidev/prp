import { Router } from 'express';
import { login, register, refresh, me, test } from '../controllers/authController.js';
import auth from '../middleware/auth.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.get('/me', auth, me);
router.get('/test', auth, test);

export default router;
