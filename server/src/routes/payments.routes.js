import { Router } from 'express';
import { createCheckout, getPayment, stripeWebhook } from '../controllers/payment.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import { createCheckoutSessionSchema } from '../validators/order.routes.validators.js';

const router = Router();

// Stripe webhook is public and signature-verified; it must keep the raw body.
router.post('/payments/webhook', stripeWebhook);

router.post(
  '/payments/create-checkout-session',
  authenticate,
  validate(createCheckoutSessionSchema),
  createCheckout,
);
router.get('/payments/:id', authenticate, getPayment);

export default router;
