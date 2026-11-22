import { z } from 'zod';
import { ASSIGNABLE_ROLES } from '../constants/roles.js';

const email = z.string().trim().min(1, 'Email is required').email('Enter a valid email address');
const strongPassword = z
  .string()
  .min(8, 'Use at least 8 characters')
  .regex(/[A-Z]/, 'Include an uppercase letter')
  .regex(/[0-9]/, 'Include a number');

const photoURL = z
  .union([z.string().trim().url('Enter a valid image URL'), z.literal('')])
  .optional();

export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Use at least 3 characters')
    .max(30, 'Keep this under 30 characters')
    .regex(/^[a-zA-Z0-9_. -]+$/, 'Use letters, numbers, spaces, dots, hyphens or underscores'),
  email,
  password: strongPassword,
  photoURL,
  // Admin is deliberately absent: it can never be requested by a client.
  role: z.enum(ASSIGNABLE_ROLES).optional().default('user'),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});

export const firebaseSchema = z.object({
  idToken: z.string().trim().min(1, 'A Firebase ID token is required.'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().trim().min(1, 'A refresh token is required.'),
});
