import { Router } from 'express';
import { 
  register, 
  login, 
  refresh, 
  logout, 
  changePassword, 
  getProfile, 
  updateProfile, 
  getSessions, 
  revokeSession,
  verifyActivationToken,
  activateAccount,
  forgotPassword,
  verifyResetToken,
  resetPassword
} from '../controllers/auth.controller.js';
import authMiddleware, { optionalAuth } from '../middlewares/auth.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { 
  registerSchema, 
  loginSchema, 
  changePasswordSchema,
  activateAccountSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from '../validators/auth.validator.js';
import { authLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', optionalAuth, logout);
router.post('/change-password', authMiddleware, validate(changePasswordSchema), changePassword);
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.get('/sessions', authMiddleware, getSessions);
router.delete('/sessions/:token', authMiddleware, revokeSession);

// Activation & Password Reset
router.get('/activate-account/verify', verifyActivationToken);
router.post('/activate-account', authLimiter, validate(activateAccountSchema), activateAccount);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.get('/reset-password/verify', verifyResetToken);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), resetPassword);

export default router;

