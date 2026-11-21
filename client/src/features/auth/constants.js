import { ROLES } from "@/constants/roles";

/**
 * Roles a user may choose during self-registration.
 * Admin (and pharmacist) can only be granted by the backend.
 */
export const ASSIGNABLE_ROLES = [ROLES.CUSTOMER, ROLES.VENDOR];

export const ROLE_LABELS = {
  [ROLES.CUSTOMER]: "User",
  [ROLES.VENDOR]: "Seller",
  [ROLES.ADMIN]: "Admin",
  [ROLES.PHARMACIST]: "Pharmacist",
};

export const AUTH_PROVIDERS = {
  GOOGLE: "google",
  GITHUB: "github",
};

export const DEFAULT_SOCIAL_ROLE = ROLES.CUSTOMER;
