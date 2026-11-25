import {
  createCheckoutSession,
  getPaymentForUser,
  handleWebhookEvent,
  verifyWebhookEvent,
} from '../services/payment.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { logger } from '../utils/logger.js';
import { sendSuccess } from '../utils/apiResponse.js';

/** POST /api/payments/create-checkout-session */
export const createCheckout = asyncHandler(async (req, res) => {
  const { orderId } = req.validated.body;
  // The browser's idempotency key is for order deduplication only; the Stripe
  // session key is derived from the order id inside the service.
  const payment = await createCheckoutSession(req.user._id, orderId);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Checkout session created.',
    data: { payment },
  });
});

/**
 * POST /api/payments/webhook — uses the raw body so Stripe can verify the
 * HMAC signature. This is the only source of truth for payment completion.
 */
export const stripeWebhook = asyncHandler(async (req, res) => {
  const event = verifyWebhookEvent(req.body, req.headers['stripe-signature']);
  const result = await handleWebhookEvent(event);

  logger.info(`Stripe webhook ${event.id} (${event.type}): ${JSON.stringify(result)}`);
  return res.status(200).json({ received: true, ...result });
});

/** GET /api/payments/:id — by payment id, Stripe session id or order id. */
export const getPayment = asyncHandler(async (req, res) => {
  const payment = await getPaymentForUser(req.user._id, req.params.id);
  return sendSuccess(res, { message: 'Payment retrieved.', data: { payment } });
});
