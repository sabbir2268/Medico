import {
  addCartItem,
  clearCart,
  getCart,
  mergeGuestCart,
  removeCartItem,
  updateCartItem,
} from '../services/cart.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';

const userId = (req) => req.user._id;

export const getCartController = asyncHandler(async (req, res) =>
  sendSuccess(res, { message: 'Cart retrieved.', data: { cart: await getCart(userId(req)) } }),
);

export const addItem = asyncHandler(async (req, res) => {
  const { medicineId, quantity } = req.validated.body;
  const cart = await addCartItem(userId(req), medicineId, quantity);
  return sendSuccess(res, { message: 'Item added to cart.', data: { cart } });
});

export const updateItem = asyncHandler(async (req, res) => {
  const cart = await updateCartItem(userId(req), req.params.medicineId, req.validated.body.quantity);
  return sendSuccess(res, { message: 'Cart updated.', data: { cart } });
});

export const removeItem = asyncHandler(async (req, res) => {
  const cart = await removeCartItem(userId(req), req.params.medicineId);
  return sendSuccess(res, { message: 'Item removed from cart.', data: { cart } });
});

export const clearCartController = asyncHandler(async (req, res) => {
  const cart = await clearCart(userId(req));
  return sendSuccess(res, { message: 'Cart cleared.', data: { cart } });
});

export const mergeCart = asyncHandler(async (req, res) => {
  const cart = await mergeGuestCart(userId(req), req.validated.body.items);
  return sendSuccess(res, { message: 'Guest cart merged.', data: { cart } });
});
