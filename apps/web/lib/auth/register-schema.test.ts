import { describe, expect, it } from "vitest";

import { registerSchema } from "./register-schema";

const validRegisterValues = {
  firstName: "Alex",
  lastName: "Morgan",
  email: "alex.morgan@example.com",
  password: "password123",
};

describe("registerSchema", () => {
  it("accepts valid register values", () => {
    const result = registerSchema.safeParse(validRegisterValues);

    expect(result.success).toBe(true);
  });

  it("trims name and email values", () => {
    const result = registerSchema.parse({
      ...validRegisterValues,
      firstName: "  Alex  ",
      lastName: "  Morgan  ",
      email: "  alex.morgan@example.com  ",
    });

    expect(result.firstName).toBe("Alex");
    expect(result.lastName).toBe("Morgan");
    expect(result.email).toBe("alex.morgan@example.com");
  });

  it("requires first name and last name values", () => {
    const result = registerSchema.safeParse({
      ...validRegisterValues,
      firstName: "   ",
      lastName: "   ",
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.firstName).toContain(
      "First name is required",
    );
    expect(result.error?.flatten().fieldErrors.lastName).toContain(
      "Last name is required",
    );
  });

  it("limits first name and last name length to 100 characters", () => {
    const result = registerSchema.safeParse({
      ...validRegisterValues,
      firstName: "a".repeat(101),
      lastName: "b".repeat(101),
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.firstName).toContain(
      "First name must be 100 characters or fewer",
    );
    expect(result.error?.flatten().fieldErrors.lastName).toContain(
      "Last name must be 100 characters or fewer",
    );
  });

  it("requires an email value", () => {
    const result = registerSchema.safeParse({
      ...validRegisterValues,
      email: "   ",
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.email).toContain(
      "Email is required",
    );
  });

  it("requires a valid email format", () => {
    const result = registerSchema.safeParse({
      ...validRegisterValues,
      email: "not-an-email",
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.email).toContain(
      "Enter a valid email address",
    );
  });

  it("limits email length to 255 characters", () => {
    const result = registerSchema.safeParse({
      ...validRegisterValues,
      email: `${"a".repeat(256)}@example.com`,
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.email).toContain(
      "Email must be 255 characters or fewer",
    );
  });

  it("requires a password value", () => {
    const result = registerSchema.safeParse({
      ...validRegisterValues,
      password: "",
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.password).toContain(
      "Password is required",
    );
  });

  it("requires a password with at least 8 characters", () => {
    const result = registerSchema.safeParse({
      ...validRegisterValues,
      password: "short",
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.password).toContain(
      "Password must be at least 8 characters",
    );
  });

  it("limits password length to 72 characters", () => {
    const result = registerSchema.safeParse({
      ...validRegisterValues,
      password: "a".repeat(73),
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.password).toContain(
      "Password must be 72 characters or fewer",
    );
  });
});
