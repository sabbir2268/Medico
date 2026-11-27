import { z } from 'zod';

const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid medicine id.');
const quantity = z.coerce.number().int().min(1, 'Quantity must be at least 1.').max(100, 'Quantity must not exceed 100.');

export const addCartItemSchema = z.object({
  medicineId: objectId,
  quantity: quantity.optional().default(1),
});

export const updateCartItemSchema = z.object({
  quantity,
});

export const mergeCartSchema = z.object({
  items: z
    .array(z.object({ medicineId: objectId, quantity: quantity.optional().default(1) }))
    .max(100, 'A cart can contain at most 100 items.'),
});
