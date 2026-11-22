import { z } from "zod";

const phone = z
  .string()
  .trim()
  .min(7, "Enter a valid phone number")
  .max(20, "Phone number is too long")
  .regex(/^[0-9+\s()-]+$/, "Use digits, spaces, +, - or parentheses only");

export const checkoutSchema = z.object({
  fullName: z.string().trim().min(2, "Enter the recipient name").max(100),
  phone,
  addressLine1: z.string().trim().min(4, "Enter the delivery address").max(200),
  addressLine2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().min(2, "Enter the city").max(80),
  postalCode: z.string().trim().min(3, "Enter the postal code").max(20),
  country: z.string().trim().min(2).max(80).default("Bangladesh"),
  instructions: z.string().trim().max(500).optional().or(z.literal("")),
  prescriberName: z.string().trim().max(120).optional().or(z.literal("")),
  prescriptionNumber: z.string().trim().max(80).optional().or(z.literal("")),
  documentUrl: z
    .union([z.string().trim().url("Enter a valid document URL"), z.literal("")])
    .optional(),
});

export const defaultCheckoutValues = {
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  postalCode: "",
  country: "Bangladesh",
  instructions: "",
  prescriberName: "",
  prescriptionNumber: "",
  documentUrl: "",
};
