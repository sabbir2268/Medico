/**
 * Canonical roles shared by models, middleware and controllers.
 * Client-side role selection is never authoritative: only values stored in the
 * database (or set by a trusted Firebase Admin custom claim) are honoured.
 */
export const ROLES = Object.freeze({
  USER: "user",
  SELLER: "seller",
  ADMIN: "admin",
  PHARMACIST: "pharmacist",
});

export const USER_ROLES = Object.freeze(Object.values(ROLES));

/** Roles a visitor may request during self-service registration. */
export const ASSIGNABLE_ROLES = Object.freeze([ROLES.USER, ROLES.SELLER]);
