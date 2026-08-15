import { Router } from 'express';
import { register, login, refresh, logout, changePassword, getProfile, updateProfile, getSessions, revokeSession } from '../controllers/auth.controller.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { registerSchema, loginSchema, changePasswordSchema } from '../validators/auth.validator.js';
import { authLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', authMiddleware, logout);
router.post('/change-password', authMiddleware, validate(changePasswordSchema), changePassword);
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.get('/sessions', authMiddleware, getSessions);
router.delete('/sessions/:token', authMiddleware, revokeSession);

export default router;
