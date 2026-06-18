import { describe, expect, it } from "vitest";

import { resolveRequestId } from "./request-id";

describe("resolveRequestId", () => {
  it("returns the trimmed incoming request id when present", () => {
    expect(resolveRequestId("  req-123  ")).toBe("req-123");
  });

  it("generates a new request id when the header is missing", () => {
    expect(resolveRequestId(undefined)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it("generates a new request id when the header is blank", () => {
    expect(resolveRequestId("   ")).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });
});
