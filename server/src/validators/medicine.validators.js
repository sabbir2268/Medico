import { z } from 'zod';

const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid id.');
const image = z.string().trim().url('Enter a valid image URL.');

const medicineFields = {
  name: z.string().trim().min(2).max(160),
  genericName: z.string().trim().max(160).optional().default(''),
  manufacturer: z.string().trim().max(160).optional().default(''),
  description: z.string().trim().max(4000).optional().default(''),
  strength: z.string().trim().max(60).optional().default(''),
  form: z.string().trim().max(60).optional().default('Tablet'),
  category: objectId,
  price: z.number().nonnegative('Price must not be negative.').max(1_000_000),
  discountPercent: z.number().min(0).max(100).optional().default(0),
  stock: z.number().int().min(0).max(1_000_000),
  images: z.array(image).max(8).optional().default([]),
  prescriptionRequired: z.boolean().optional().default(false),
  isFeatured: z.boolean().optional().default(false),
  status: z.enum(['active', 'inactive', 'out_of_stock']).optional().default('active'),
};

export const createMedicineSchema = z.object(medicineFields);
export const updateMedicineSchema = z.object(medicineFields).partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: 'At least one field is required.' },
);
