import { z } from 'zod';

const phone = z
  .string()
  .trim()
  .min(7, 'Enter a valid phone number.')
  .max(20, 'Phone number is too long.')
  .regex(/^[0-9+\s()-]+$/, 'Use digits, spaces, +, - or parentheses only.');

export const updateProfileSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, 'Use at least 3 characters')
      .max(30, 'Keep this under 30 characters')
      .optional(),
    email: z.string().trim().email('Enter a valid email address').optional(),
    photoURL: z
      .union([z.string().trim().url('Enter a valid image URL'), z.literal('')])
      .optional(),
    phone: phone.optional(),
    address: z
      .object({
        addressLine1: z.string().trim().max(200).optional().default(''),
        addressLine2: z.string().trim().max(200).optional().default(''),
        city: z.string().trim().max(80).optional().default(''),
        postalCode: z.string().trim().max(20).optional().default(''),
        country: z.string().trim().max(80).optional().default('Bangladesh'),
      })
      .optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one profile field is required.',
  });
