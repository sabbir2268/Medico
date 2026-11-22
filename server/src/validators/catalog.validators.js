import { z } from 'zod';

const optionalNumber = (name) =>
  z.preprocess(
    (value) => (value === '' || value === undefined ? undefined : Number(value)),
    z.number({ invalid_type_error: `${name} must be a number.` }).nonnegative(`${name} must not be negative.`).optional(),
  );

export const medicineQuerySchema = z.object({
  search: z.string().trim().max(120).optional().default(''),
  category: z.string().trim().max(120).optional().default(''),
  sort: z.enum(['price', '-price', '-discountPercent', 'name']).optional().default(''),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  minPrice: optionalNumber('minPrice'),
  maxPrice: optionalNumber('maxPrice'),
});

export const categoryQuerySchema = z.object({
  active: z
    .enum(['true', 'false'])
    .optional()
    .default('true')
    .transform((value) => value === 'true'),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const limitedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional().default(8),
});

export const objectIdSchema = z.object({
  id: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid resource id.'),
});
