import { Order } from '../models/Order.js';
import { Payment } from '../models/Payment.js';
import { Medicine } from '../models/Medicine.js';
import { env } from '../config/env.js';
import { getStripe } from '../config/stripe.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import { buildPagination } from '../utils/pagination.js';

// Bump this when the Checkout Session payload changes: Stripe caches error
// responses against the idempotency key, so a retried request with the old key
// would replay the deprecated `payment_method_types` error for up to 24 hours.
const CHECKOUT_PAYLOAD_VERSION = 2;

export function serializePayment(doc) {
  if (!doc) return null;
  return {
    id: String(doc._id),
    orderId: String(doc.order),
    orderNumber: `MD-${String(doc.order).slice(-8).toUpperCase()}`,
    status: doc.status,
    provider: doc.provider,
    amount: doc.amount,
    currency: doc.currency,
    stripeSessionId: doc.stripeSessionId ?? null,
    stripePaymentIntentId: doc.stripePaymentIntentId ?? null,
    checkoutUrl: doc.checkoutUrl ?? '',
    failureReason: doc.failureReason ?? '',
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

async function restoreOrderStock(order) {
  if (order.stockRestored || order.paymentStatus === 'paid') return;

  const result = await Order.updateOne(
    { _id: order._id, stockRestored: false, paymentStatus: { $ne: 'paid' } },
    { $set: { stockRestored: true } },
  );
  if (result.modifiedCount !== 1) return;

  for (const item of order.items) {
    await Medicine.updateOne({ _id: item.medicine }, { $inc: { stock: item.quantity } });
  }
}

/**
 * Creates a real Stripe Checkout session from trusted order snapshot prices.
 *
 * The Stripe idempotency key is derived from the order id and the payload
 * version. A client-supplied key must NEVER be forwarded here: the browser
 * reuses one stable key for order creation and checkout, and Stripe rejects a
 * reused key when the request parameters change (e.g. after an API migration).
 */
export async function createCheckoutSession(userId, orderId) {
  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) {
    throw new ApiError(404, 'Order not found.', { code: ERROR_CODES.NOT_FOUND });
  }
  if (order.status === 'cancelled') {
    throw new ApiError(409, 'This order was cancelled.', {
      code: ERROR_CODES.ORDER_NOT_CANCELLABLE,
    });
  }

  const existing = await Payment.findOne({ order: order._id });
  if (existing?.status === 'paid') {
    throw new ApiError(409, 'This order has already been paid.', {
      code: ERROR_CODES.DUPLICATE_REQUEST,
    });
  }
  if (existing?.checkoutUrl && existing.status === 'pending') {
    return serializePayment(existing);
  }

  const stripe = getStripe();
  if (!stripe) {
    throw new ApiError(503, 'Stripe is not configured on the server.', {
      code: ERROR_CODES.PAYMENT_NOT_CONFIGURED,
    });
  }

  const lineItems = order.items.map((item) => ({
    price_data: {
      currency: 'usd',
      product_data: { name: item.name, description: item.manufacturer || item.genericName },
      // unitPrice is already the server-computed discounted price.
      unit_amount: Math.round(item.unitPrice * 100),
    },
    quantity: item.quantity,
  }));

  if (order.pricing.deliveryCharge > 0) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: { name: 'Delivery charge' },
        unit_amount: Math.round(order.pricing.deliveryCharge * 100),
      },
      quantity: 1,
    });
  }

  const session = await stripe.checkout.sessions.create(
    {
      mode: 'payment',
      // Stripe removed `payment_method_types` from Checkout Sessions
      // (2026-09-30). Use `allowed_payment_method_types` to keep card-only.
      allowed_payment_method_types: ['card'],
      line_items: lineItems,
      client_reference_id: String(order._id),
      metadata: { orderId: String(order._id), userId: String(userId) },
      success_url: `${env.stripe.successUrl}?order_id=${order._id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.stripe.cancelUrl}?order_id=${order._id}`,
    },
    { idempotencyKey: `checkout-v${CHECKOUT_PAYLOAD_VERSION}-${order._id}` },
  );

  const paymentFields = {
    user: userId,
    stripeSessionId: session.id,
    amount: order.pricing.total,
    currency: 'usd',
    status: 'pending',
    checkoutUrl: session.url ?? '',
  };
  const paymentUpdate = { $set: paymentFields };

  // These two fields are sparse+unique. Writing `null` indexes the null value,
  // so the second payment collides with the first one. Omit/unset when Stripe
  // does not return an id yet (common for Checkout Sessions).
  if (session.payment_intent) {
    paymentFields.stripePaymentIntentId = session.payment_intent;
  } else {
    paymentUpdate.$unset = { stripePaymentIntentId: 1 };
  }

  const payment = await Payment.findOneAndUpdate(
    { order: order._id },
    paymentUpdate,
    { upsert: true, returnDocument: 'after' },
  );

  order.payment = payment._id;
  order.stripeSessionId = session.id;
  await order.save({ validateBeforeSave: false });

  return serializePayment(payment);
}

/** Verifies the Stripe signature against the raw request body. */
export function verifyWebhookEvent(rawBody, signature) {
  const stripe = getStripe();
  if (!stripe || !env.stripe.webhookSecret) {
    throw new ApiError(503, 'Stripe webhooks are not configured.', {
      code: ERROR_CODES.PAYMENT_NOT_CONFIGURED,
    });
  }
  if (!signature) {
    throw new ApiError(400, 'Missing Stripe signature header.', {
      code: ERROR_CODES.WEBHOOK_INVALID_SIGNATURE,
    });
  }

  try {
    return stripe.webhooks.constructEvent(rawBody, signature, env.stripe.webhookSecret);
  } catch {
    throw new ApiError(400, 'Invalid Stripe webhook signature.', {
      code: ERROR_CODES.WEBHOOK_INVALID_SIGNATURE,
    });
  }
}

/** Applies only verified Stripe events. Redirects are never trusted. */
export async function handleWebhookEvent(event) {
  const payment = event?.data?.object?.id
    ? await Payment.findOne({ stripeSessionId: event.data.object.id })
    : null;
  const alreadyProcessed = payment?.lastEventId === event.id;
  if (alreadyProcessed) return { processed: false, duplicate: true };

  const isCompleted =
    event.type === 'checkout.session.completed' ||
    event.type === 'checkout.session.async_payment_succeeded';
  const isFailed =
    event.type === 'checkout.session.expired' ||
    event.type === 'checkout.session.async_payment_failed';

  if (!isCompleted && !isFailed) return { processed: false, duplicate: false };
  if (!payment) return { processed: false, duplicate: false };

  const session = event.data.object;
  const paid = isCompleted && session.payment_status === 'paid';

  if (paid) {
    if (payment.status === 'paid') return { processed: false, duplicate: true };
    payment.status = 'paid';
    if (session.payment_intent && session.payment_intent !== payment.stripePaymentIntentId) {
      payment.stripePaymentIntentId = session.payment_intent;
    }
    payment.lastEventId = event.id;
    await payment.save();

    await Order.updateOne(
      { _id: payment.order },
      { $set: { paymentStatus: 'paid', status: 'processing' } },
    );
    return { processed: true, duplicate: false };
  }

  if (isFailed) {
    payment.status = event.type === 'checkout.session.expired' ? 'expired' : 'failed';
    payment.failureReason = session.payment_status ?? event.type;
    payment.lastEventId = event.id;
    await payment.save();

    await Order.updateOne({ _id: payment.order }, { $set: { paymentStatus: 'failed' } });
    const order = await Order.findById(payment.order);
    if (order) await restoreOrderStock(order);
    return { processed: true, duplicate: false };
  }

  return { processed: false, duplicate: false };
}

export async function getPaymentForUser(userId, id) {
  const isObjectId = /^[a-fA-F0-9]{24}$/.test(id);
  const conditions = isObjectId ? [{ _id: id }, { order: id }] : [];
  conditions.push({ stripeSessionId: id });

  const payment = await Payment.findOne({ user: userId, $or: conditions });
  if (!payment) {
    throw new ApiError(404, 'Payment not found.', { code: ERROR_CODES.NOT_FOUND });
  }
  return serializePayment(payment);
}

export async function listPaymentsForUser(userId, { page, limit } = {}) {
  const [total, docs] = await Promise.all([
    Payment.countDocuments({ user: userId }),
    Payment.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
  ]);

  return {
    items: docs.map(serializePayment),
    pagination: buildPagination({ page, limit, total }),
  };
}
