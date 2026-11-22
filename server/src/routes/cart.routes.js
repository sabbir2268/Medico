import { Router } from 'express';
import {
  addItem,
  clearCartController,
  getCartController,
  mergeCart,
  removeItem,
  updateItem,
} from '../controllers/cart.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { validate } from '../middleware/validate.js';
import {
  addCartItemSchema,
  mergeCartSchema,
  updateCartItemSchema,
} from '../validators/cart.validators.js';

const router = Router();

// Apply authentication per route: router.use() would leak into sibling routers
// mounted later on the parent /api router (orders, payments, dashboard).
router.get('/cart', authenticate, getCartController);
router.post('/cart/items', authenticate, validate(addCartItemSchema), addItem);
router.patch('/cart/items/:medicineId', authenticate, validate(updateCartItemSchema), updateItem);
router.delete('/cart/items/:medicineId', authenticate, removeItem);
router.delete('/cart', authenticate, clearCartController);
router.post('/cart/merge', authenticate, validate(mergeCartSchema), mergeCart);

export default router;
