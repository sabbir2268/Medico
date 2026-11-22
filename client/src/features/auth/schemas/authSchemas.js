import { z } from "zod";
import { ROLES } from "@/constants/roles";

const email = z.string().trim().min(1, "Email is required").email("Enter a valid email address");
const photoURL = z
  .union([z.string().trim().url("Enter a valid image URL"), z.literal("")])
  .optional();
const strongPassword = z
  .string()
  .min(8, "Use at least 8 characters")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[0-9]/, "Include a number");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, "Use at least 3 characters")
      .max(30, "Keep this under 30 characters")
      .regex(/^[a-zA-Z0-9_. -]+$/, "Use letters, numbers, spaces, dots, hyphens or underscores"),
    email,
    photoURL,
    password: strongPassword,
    confirmPassword: z.string().min(1, "Confirm your password"),
    role: z.enum([ROLES.USER, ROLES.SELLER]),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const profileSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Use at least 3 characters")
    .max(30, "Keep this under 30 characters"),
  email,
  photoURL,
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\s()-]*$/, "Use digits, spaces, +, - or parentheses only")
    .optional()
    .or(z.literal("")),
  addressLine1: z.string().trim().max(200).optional().or(z.literal("")),
  addressLine2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  postalCode: z.string().trim().max(20).optional().or(z.literal("")),
  country: z.string().trim().max(80).optional().or(z.literal("")),
});

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: strongPassword,
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const resetPasswordSchema = z.object({ email });
