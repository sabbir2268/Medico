import { z } from "zod";
import { ROLES } from "@/constants/roles";
import { ASSIGNABLE_ROLES } from "../constants";

const emailField = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .email("Enter a valid email address.");

const passwordField = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password must be 72 characters or fewer.");

const photoUrlField = z
  .string()
  .trim()
  .max(2048, "Photo URL is too long.")
  .refine(
    (value) => value === "" || /^https?:\/\/\S+$/i.test(value),
    "Enter a valid http(s) image URL.",
  );

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Password is required."),
});

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters.")
      .max(60, "Name must be 60 characters or fewer."),
    email: emailField,
    password: passwordField,
    confirmPassword: z.string().min(1, "Confirm your password."),
    photoURL: photoUrlField,
    role: z.enum(ASSIGNABLE_ROLES, {
      message: "Choose whether you are a user or a seller.",
    }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(60, "Name must be 60 characters or fewer."),
  photoURL: photoUrlField,
});

export const roleSchema = z.enum(ASSIGNABLE_ROLES);

/**
 * Firebase accepts these roles from the client, but the backend must still
 * validate them. Admin can never be submitted from this form.
 */
export const safeRegisterDefaults = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  photoURL: "",
  role: ROLES.CUSTOMER,
};
