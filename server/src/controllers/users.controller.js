import { sanitizeUser } from '../utils/sanitizeUser.js';
import { ApiError } from '../utils/ApiError.js';
import { ERROR_CODES } from '../constants/errorCodes.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendPaginated, sendSuccess } from '../utils/apiResponse.js';
import { User } from '../models/User.js';
import {
  cancelOrder as cancelOrderService,
  getOrderForUser,
  listOrdersForUser,
} from '../services/order.service.js';
import { listPaymentsForUser } from '../services/payment.service.js';

/** GET /api/users/me — current account summary. */
export const getMe = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    message: 'Account retrieved.',
    data: { user: sanitizeUser(req.user) },
  }),
);

/** PATCH /api/users/profile — only contact/display fields are editable. */
export const updateProfile = asyncHandler(async (req, res) => {
  const updates = req.validated.body;
  const user = req.user;

  if (updates.username) {
    const taken = await User.exists({ username: updates.username, _id: { $ne: user._id } });
    if (taken) {
      throw new ApiError(409, 'This username is already taken.', {
        code: ERROR_CODES.DUPLICATE_KEY,
        errors: { username: 'Choose another username.' },
      });
    }
  }

  if (updates.email && updates.email.toLowerCase() !== user.email) {
    const taken = await User.exists({ email: updates.email, _id: { $ne: user._id } });
    if (taken) {
      throw new ApiError(409, 'This email is already registered.', {
        code: ERROR_CODES.EMAIL_IN_USE,
        errors: { email: 'This email is already registered.' },
      });
    }
  }

  if (updates.email) user.email = updates.email.toLowerCase();
  if (updates.username) {
    user.username = updates.username;
    user.displayName = updates.username;
  }
  if (updates.photoURL !== undefined) user.photoURL = updates.photoURL;
  if (updates.phone !== undefined) user.phone = updates.phone;
  if (updates.address) user.address = { ...user.address, ...updates.address };

  await user.save();

  return sendSuccess(res, {
    message: 'Profile updated successfully.',
    data: { user: sanitizeUser(user) },
  });
});

export const listOrders = asyncHandler(async (req, res) => {
  const result = await listOrdersForUser(req.user._id, req.validated.query);
  return sendPaginated(res, { items: result.items, pagination: result.pagination });
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await getOrderForUser(req.user._id, req.params.id);
  return sendSuccess(res, { message: 'Order retrieved.', data: { order } });
});

export const listPayments = asyncHandler(async (req, res) => {
  const result = await listPaymentsForUser(req.user._id, req.validated.query);
  return sendPaginated(res, { items: result.items, pagination: result.pagination });
});

export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await cancelOrderService(req.user._id, req.params.id);
  return sendSuccess(res, { message: 'Order cancelled. Stock has been restored.', data: { order } });
});
