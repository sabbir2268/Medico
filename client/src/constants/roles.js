/**
 * `user` and `seller` are the only roles a visitor may choose. Admin and
 * pharmacist are kept for server-assigned accounts and role-protected routes.
 * The legacy customer/vendor names alias the new canonical values.
 */
export const ROLES = Object.freeze({
  USER: "user",
  SELLER: "seller",
  CUSTOMER: "user",
  VENDOR: "seller",
  ADMIN: "admin",
  PHARMACIST: "pharmacist",
});

export const ASSIGNABLE_ROLES = Object.freeze([
  { value: ROLES.USER, label: "User", description: "Shop for medicines and manage orders." },
  { value: ROLES.SELLER, label: "Seller", description: "List and manage products as a vendor." },
]);

/**
 * Security boundary: a value coming from a form can never escalate to admin.
 * Only a trusted backend response may set privileged roles.
 */
export function normalizeAssignableRole(role) {
  return role === ROLES.SELLER ? ROLES.SELLER : ROLES.USER;
}

export function isPrivilegedRole(role) {
  return role === ROLES.ADMIN || role === ROLES.PHARMACIST;
}

/** Roles that may only arrive from a trusted backend response. */
export const SERVER_ROLES = Object.freeze([
  ROLES.USER,
  ROLES.SELLER,
  ROLES.ADMIN,
  ROLES.PHARMACIST,
]);

export function normalizeServerRole(role) {
  return SERVER_ROLES.includes(role) ? role : ROLES.USER;
}
