import { z } from 'zod';
import { USER_ROLES, ASSIGNABLE_ROLES } from '../constants/roles.js';

const optionalDate = z
  .string()
  .trim()
  .refine((value) => !Number.isNaN(new Date(value).getTime()), 'Enter a valid date.')
  .optional();

export const adminQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  search: z.string().trim().max(120).optional().default(''),
  role: z.enum(USER_ROLES).optional(),
  status: z.string().trim().max(40).optional(),
  from: optionalDate,
  to: optionalDate,
});

export const analyticsQuerySchema = z.object({ from: optionalDate, to: optionalDate });

export const roleUpdateSchema = z.object({
  // Admin is deliberately excluded: the configured ADMIN_EMAIL is the only
  // account allowed to hold that role, and it is never assigned via the API.
  role: z.enum(ASSIGNABLE_ROLES),
});

export const userStatusSchema = z.object({
  isActive: z.coerce.boolean(),
});

export const sellerStatusSchema = z.object({
  sellerStatus: z.enum(['pending', 'approved', 'suspended', 'rejected']),
  reason: z.string().trim().max(300).optional().default(''),
});

const tone = z.enum(['teal', 'emerald', 'amber', 'blue', 'rose', 'violet', 'cyan']).optional();

export const categorySchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers and hyphens.')
    .optional(),
  description: z.string().trim().max(500).optional().default(''),
  image: z.union([z.string().trim().url(), z.literal('')]).optional().default(''),
  visual: z.string().trim().max(40).optional(),
  tone,
  isActive: z.coerce.boolean().optional().default(true),
  sortOrder: z.coerce.number().int().min(0).optional().default(0),
});

// PATCH schemas omit defaults: an absent field must never be reset to a default.
export const updateCategorySchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers and hyphens.')
      .optional(),
    description: z.string().trim().max(500).optional(),
    image: z.union([z.string().trim().url(), z.literal('')]).optional(),
    visual: z.string().trim().max(40).optional(),
    tone,
    isActive: z.coerce.boolean().optional(),
    sortOrder: z.coerce.number().int().min(0).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one field is required.' });

export const medicineStatusSchema = z.object({
  status: z.enum(['approved', 'hidden', 'inactive', 'active', 'rejected']),
  reason: z.string().trim().max(300).optional().default(''),
});

export const advertisementStatusSchema = z
  .object({
    status: z.enum(['pending', 'approved', 'rejected']),
    reason: z.string().trim().max(300).optional().default(''),
  })
  .refine((value) => value.status !== 'rejected' || value.reason.trim().length > 0, {
    message: 'A rejection reason is required.',
    path: ['reason'],
  });

export const healthTipSchema = z.object({
  title: z.string().trim().min(3).max(200),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers and hyphens.')
    .optional(),
  excerpt: z.string().trim().max(500).optional().default(''),
  content: z.string().trim().max(10000).optional().default(''),
  image: z.union([z.string().trim().url(), z.literal('')]).optional().default(''),
  category: z.string().trim().max(80).optional().default('General'),
  visual: z.string().trim().max(40).optional().default('heart'),
  tone,
  readMinutes: z.coerce.number().int().min(1).max(60).optional().default(3),
  isActive: z.coerce.boolean().optional().default(true),
  publishedAt: optionalDate,
});

export const updateHealthTipSchema = z
  .object({
    title: z.string().trim().min(3).max(200).optional(),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers and hyphens.')
      .optional(),
    excerpt: z.string().trim().max(500).optional(),
    content: z.string().trim().max(10000).optional(),
    image: z.union([z.string().trim().url(), z.literal('')]).optional(),
    category: z.string().trim().max(80).optional(),
    visual: z.string().trim().max(40).optional(),
    tone,
    readMinutes: z.coerce.number().int().min(1).max(60).optional(),
    isActive: z.coerce.boolean().optional(),
    publishedAt: optionalDate,
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one field is required.' });

export const objectIdSchema = z.object({
  id: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid resource id.'),
});
