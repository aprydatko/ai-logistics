import { describe, expect, it } from "vitest";

import {
  ADMIN_DISPATCHER_ROLES,
  DOCUMENT_RECIPIENT_ROLES,
  USER_ROLES,
  isUserRole,
} from "./roles";

describe("roles constants", () => {
  it("exposes the canonical role list", () => {
    expect(USER_ROLES).toEqual(["admin", "dispatcher", "manager", "driver"]);
  });

  it("includes admin and dispatcher in the admin/dispatcher group", () => {
    expect(ADMIN_DISPATCHER_ROLES).toEqual(["admin", "dispatcher"]);
  });

  it("includes manager in the document recipient group", () => {
    expect(DOCUMENT_RECIPIENT_ROLES).toEqual([
      "admin",
      "dispatcher",
      "manager",
    ]);
  });
});

describe("isUserRole", () => {
  it("returns true for each canonical role", () => {
    for (const role of USER_ROLES) {
      expect(isUserRole(role)).toBe(true);
    }
  });

  it("returns false for unknown strings", () => {
    expect(isUserRole("super-admin")).toBe(false);
    expect(isUserRole("")).toBe(false);
  });

  it("returns false for non-string values", () => {
    expect(isUserRole(null)).toBe(false);
    expect(isUserRole(undefined)).toBe(false);
    expect(isUserRole(0)).toBe(false);
    expect(isUserRole({})).toBe(false);
  });
});
