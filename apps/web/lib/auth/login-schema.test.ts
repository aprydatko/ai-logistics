import { describe, expect, it } from "vitest";

import { loginSchema } from "./login-schema";

const validLoginValues = {
  email: "dispatcher@example.com",
  password: "password123",
};

describe("loginSchema", () => {
  it("accepts valid login values", () => {
    const result = loginSchema.safeParse(validLoginValues);

    expect(result.success).toBe(true);
  });

  it("trims the email value", () => {
    const result = loginSchema.parse({
      ...validLoginValues,
      email: "  dispatcher@example.com  ",
    });

    expect(result.email).toBe("dispatcher@example.com");
  });

  it("requires an email value", () => {
    const result = loginSchema.safeParse({
      ...validLoginValues,
      email: "   ",
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.email).toContain("Email is required");
  });

  it("requires a valid email format", () => {
    const result = loginSchema.safeParse({
      ...validLoginValues,
      email: "not-an-email",
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.email).toContain(
      "Enter a valid email address",
    );
  });

  it("limits email length to 255 characters", () => {
    const result = loginSchema.safeParse({
      ...validLoginValues,
      email: `${"a".repeat(256)}@example.com`,
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.email).toContain(
      "Email must be 255 characters or fewer",
    );
  });

  it("requires a password value", () => {
    const result = loginSchema.safeParse({
      ...validLoginValues,
      password: "",
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.password).toContain(
      "Password is required",
    );
  });

  it("requires a password with at least 8 characters", () => {
    const result = loginSchema.safeParse({
      ...validLoginValues,
      password: "short",
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.password).toContain(
      "Password must be at least 8 characters",
    );
  });

  it("limits password length to 72 characters", () => {
    const result = loginSchema.safeParse({
      ...validLoginValues,
      password: "a".repeat(73),
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.password).toContain(
      "Password must be 72 characters or fewer",
    );
  });
});
