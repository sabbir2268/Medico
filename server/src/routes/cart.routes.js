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

router.use(authenticate);

router.get('/cart', getCartController);
router.post('/cart/items', validate(addCartItemSchema), addItem);
router.patch('/cart/items/:medicineId', validate(updateCartItemSchema), updateItem);
router.delete('/cart/items/:medicineId', removeItem);
router.delete('/cart', clearCartController);
router.post('/cart/merge', validate(mergeCartSchema), mergeCart);

export default router;
