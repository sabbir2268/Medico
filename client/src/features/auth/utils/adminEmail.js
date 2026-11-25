import { env } from "@/config/env";
import { ROLES } from "@/constants/roles";

/** True when the email is the configured, hard-coded administrator account. */
export function isConfiguredAdminEmail(email) {
  const configured = env.VITE_ADMIN_EMAIL?.trim().toLowerCase();
  return Boolean(configured && String(email ?? "").trim().toLowerCase() === configured);
}

/**
 * Applies the env-based admin rule to any user object coming from Firebase or
 * our own API. User and seller roles are left completely untouched.
 */
export function applyAdminEmail(user) {
  if (!user) return user;
  return isConfiguredAdminEmail(user.email) ? { ...user, role: ROLES.ADMIN } : user;
}

/**
 * Final UI-level normalization. The configured email is the only account that
 * can carry the admin role; everybody else keeps their user/seller role.
 */
export function normalizeUserForApp(user) {
  if (!user) return user;
  if (isConfiguredAdminEmail(user.email)) return { ...user, role: ROLES.ADMIN };
  if (env.VITE_ADMIN_EMAIL && user.role === ROLES.ADMIN) {
    return { ...user, role: ROLES.USER };
  }
  return user;
}
