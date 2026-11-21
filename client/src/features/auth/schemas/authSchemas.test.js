import { describe, expect, it } from "vitest";
import { ROLES } from "@/constants/roles";
import { loginSchema, passwordSchema, registerSchema } from "./authSchemas";

const validRegistration = {
  username: "Asha Patel",
  email: "asha@example.com",
  photoURL: "",
  password: "StrongPass1",
  confirmPassword: "StrongPass1",
  role: ROLES.USER,
};

describe("auth schemas", () => {
  it("accepts a valid registration", () => {
    expect(registerSchema.safeParse(validRegistration).success).toBe(true);
  });

  it("rejects an admin role chosen in the form", () => {
    const result = registerSchema.safeParse({ ...validRegistration, role: ROLES.ADMIN });

    expect(result.success).toBe(false);
  });

  it("rejects weak or mismatched passwords", () => {
    expect(
      registerSchema.safeParse({ ...validRegistration, password: "short" }).success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({
        ...validRegistration,
        confirmPassword: "Different1",
      }).success,
    ).toBe(false);
  });

  it("validates the login and password forms", () => {
    expect(loginSchema.safeParse({ email: "not-an-email", password: "" }).success).toBe(false);
    expect(passwordSchema.safeParse({ currentPassword: "old", newPassword: "new" }).success).toBe(
      false,
    );
  });
});
