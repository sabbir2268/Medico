import { Router } from 'express';
import {
  cancelOrder,
  getMe,
  getOrder,
  listOrders,
  listPayments,
  updateProfile,
} from '../controllers/users.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { updateProfileSchema } from '../validators/user.validators.js';
import { listQuerySchema, objectIdSchema } from '../validators/order.routes.validators.js';

const router = Router();

router.get('/users/me', authenticate, getMe);
router.patch('/users/profile', authenticate, validate(updateProfileSchema), updateProfile);

router.get('/users/orders', authenticate, validate(listQuerySchema, 'query'), listOrders);
router.get('/users/orders/:id', authenticate, validate(objectIdSchema, 'params'), getOrder);
router.post('/users/orders/:id/cancel', authenticate, validate(objectIdSchema, 'params'), cancelOrder);
router.get('/users/payments', authenticate, validate(listQuerySchema, 'query'), listPayments);

export default router;
