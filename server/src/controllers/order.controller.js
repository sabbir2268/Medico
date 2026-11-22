import {
  cancelOrder as cancelOrderService,
  createOrderFromCart,
  getOrderForUser,
} from '../services/order.service.js';
import { generateInvoiceBuffer } from '../services/invoice.service.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';

/** POST /api/orders — creates an order from the authenticated user's cart. */
export const createOrder = asyncHandler(async (req, res) => {
  const idempotencyKey = req.validated.body.idempotencyKey ?? req.headers['idempotency-key'] ?? null;
  const order = await createOrderFromCart(req.user._id, req.validated.body, idempotencyKey);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Order created successfully.',
    data: { order },
  });
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await getOrderForUser(req.user._id, req.params.id);
  return sendSuccess(res, { message: 'Order retrieved.', data: { order } });
});

/** GET /api/orders/:id/invoice — trusted, immutable PDF invoice. */
export const getInvoice = asyncHandler(async (req, res) => {
  const order = await getOrderForUser(req.user._id, req.params.id);
  const user = await User.findById(req.user._id).lean();
  const pdf = await generateInvoiceBuffer(order, user);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="medico-invoice-${String(order._id).slice(-8)}.pdf"`,
  );
  return res.send(pdf);
});

/** POST /api/users/orders/:id/cancel — handled with the same service logic. */
export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await cancelOrderService(req.user._id, req.params.id);
  return sendSuccess(res, { message: 'Order cancelled. Stock has been restored.', data: { order } });
});
