import { describe, expect, it } from "vitest";
import { ROLES, isPrivilegedRole, normalizeAssignableRole } from "@/constants/roles";

describe("role assignment boundary", () => {
  it("only keeps user and seller for self-assignment", () => {
    expect(normalizeAssignableRole(ROLES.USER)).toBe(ROLES.USER);
    expect(normalizeAssignableRole(ROLES.SELLER)).toBe(ROLES.SELLER);
    expect(normalizeAssignableRole(ROLES.ADMIN)).toBe(ROLES.USER);
    expect(normalizeAssignableRole(ROLES.PHARMACIST)).toBe(ROLES.USER);
    expect(normalizeAssignableRole(undefined)).toBe(ROLES.USER);
  });

  it("recognizes privileged roles", () => {
    expect(isPrivilegedRole(ROLES.ADMIN)).toBe(true);
    expect(isPrivilegedRole(ROLES.PHARMACIST)).toBe(true);
    expect(isPrivilegedRole(ROLES.SELLER)).toBe(false);
  });
});
