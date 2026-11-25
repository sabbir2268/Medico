import { describe, expect, it } from "vitest";
import { env } from "@/config/env";
import { ROLES } from "@/constants/roles";
import { applyAdminEmail, isConfiguredAdminEmail, normalizeUserForApp } from "./adminEmail";

const adminEmail = env.VITE_ADMIN_EMAIL;

describe("configured admin email", () => {
  it("matches case-insensitively and tolerates whitespace", () => {
    if (!adminEmail) return;
    expect(isConfiguredAdminEmail(`  ${adminEmail.toUpperCase()}  `)).toBe(true);
    expect(isConfiguredAdminEmail("somebody@example.com")).toBe(false);
    expect(isConfiguredAdminEmail(null)).toBe(false);
  });

  it("always gives the configured email the admin role", () => {
    if (!adminEmail) return;
    expect(
      applyAdminEmail({ email: adminEmail, role: ROLES.USER }).role,
    ).toBe(ROLES.ADMIN);
  });

  it("leaves user and seller accounts untouched", () => {
    const user = { email: "user@example.com", role: ROLES.USER };
    const seller = { email: "seller@example.com", role: ROLES.SELLER };

    expect(normalizeUserForApp(user)).toEqual(user);
    expect(normalizeUserForApp(seller)).toEqual(seller);
    expect(applyAdminEmail(seller).role).toBe(ROLES.SELLER);
  });

  it("does not promote other accounts to admin", () => {
    expect(normalizeUserForApp({ email: "other@example.com", role: ROLES.USER }).role).toBe(
      ROLES.USER,
    );
  });
});
