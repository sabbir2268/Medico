import { Router } from 'express';
import { createOrder, getInvoice, getOrder } from '../controllers/order.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { createOrderSchema, objectIdSchema } from '../validators/order.routes.validators.js';

const router = Router();

router.post('/orders', authenticate, validate(createOrderSchema), createOrder);
router.get('/orders/:id/invoice', authenticate, validate(objectIdSchema, 'params'), getInvoice);
router.get('/orders/:id', authenticate, validate(objectIdSchema, 'params'), getOrder);

export default router;
