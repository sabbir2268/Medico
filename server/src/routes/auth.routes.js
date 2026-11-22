import { Router } from 'express';
import {
  firebaseExchange,
  login,
  logout,
  me,
  refresh,
  register,
} from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { authRateLimiter } from '../config/rateLimiter.js';
import {
  firebaseSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
} from '../validators/auth.validators.js';

const router = Router();

router.post('/auth/register', authRateLimiter, validate(registerSchema), register);
router.post('/auth/login', authRateLimiter, validate(loginSchema), login);
router.post('/auth/firebase', authRateLimiter, validate(firebaseSchema), firebaseExchange);
router.post('/auth/refresh', authRateLimiter, validate(refreshSchema), refresh);

router.get('/auth/me', authenticate, me);
router.post('/auth/logout', authenticate, logout);

export default router;
