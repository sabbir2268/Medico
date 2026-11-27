import { z } from 'zod';

const phone = z
  .string()
  .trim()
  .min(7, 'Enter a valid phone number.')
  .max(20, 'Phone number is too long.')
  .regex(/^[0-9+\s()-]+$/, 'Use digits, spaces, +, - or parentheses only.');

export const createOrderSchema = z.object({
  idempotencyKey: z.string().trim().min(8).max(120).optional(),
  delivery: z.object({
    fullName: z.string().trim().min(2, 'Enter the recipient name.').max(100),
    phone,
    addressLine1: z.string().trim().min(4, 'Enter the delivery address.').max(200),
    addressLine2: z.string().trim().max(200).optional().default(''),
    city: z.string().trim().min(2, 'Enter the city.').max(80),
    postalCode: z.string().trim().min(3, 'Enter the postal code.').max(20),
    country: z.string().trim().min(2).max(80).optional().default('Bangladesh'),
    instructions: z.string().trim().max(500).optional().default(''),
  }),
  prescription: z
    .object({
      prescriberName: z.string().trim().min(2).max(120),
      prescriptionNumber: z.string().trim().min(3).max(80),
      documentUrl: z.string().trim().url('Enter a valid document URL.').optional().or(z.literal('')),
    })
    .optional(),
});

export const createCheckoutSessionSchema = z.object({
  orderId: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid order id.'),
  idempotencyKey: z.string().trim().min(8).max(120).optional(),
});

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  status: z
    .enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
    .optional(),
});
