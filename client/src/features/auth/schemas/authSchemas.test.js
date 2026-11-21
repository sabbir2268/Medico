import { describe, expect, it } from "vitest";
import { ROLES } from "@/constants/roles";
import { loginSchema, profileSchema, registerSchema } from "./authSchemas";

const validRegistration = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  password: "strongpass1",
  confirmPassword: "strongpass1",
  photoURL: "",
  role: ROLES.CUSTOMER,
};

describe("loginSchema", () => {
  it("accepts a valid email and password", () => {
    const result = loginSchema.safeParse({
      email: "ada@example.com",
      password: "secret",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "secret",
    });

    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("accepts a customer registration", () => {
    const result = registerSchema.safeParse(validRegistration);

    expect(result.success).toBe(true);
  });

  it("accepts a seller registration", () => {
    const result = registerSchema.safeParse({
      ...validRegistration,
      role: ROLES.VENDOR,
    });

    expect(result.success).toBe(true);
  });

  it("never accepts the admin role", () => {
    const result = registerSchema.safeParse({
      ...validRegistration,
      role: ROLES.ADMIN,
    });

    expect(result.success).toBe(false);
  });

  it("rejects mismatched passwords", () => {
    const result = registerSchema.safeParse({
      ...validRegistration,
      confirmPassword: "different-pass",
    });

    expect(result.success).toBe(false);
  });

  it("rejects short passwords", () => {
    const result = registerSchema.safeParse({
      ...validRegistration,
      password: "short",
      confirmPassword: "short",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an invalid photo URL", () => {
    const result = registerSchema.safeParse({
      ...validRegistration,
      photoURL: "not-a-url",
    });

    expect(result.success).toBe(false);
  });
});

describe("profileSchema", () => {
  it("accepts an empty photo URL", () => {
    const result = profileSchema.safeParse({
      name: "Ada Lovelace",
      photoURL: "",
    });

    expect(result.success).toBe(true);
  });
});
