import { afterEach, describe, expect, it, vi } from "vitest";

import { formatDate, getDocumentStatus } from "./profile-formatters";

describe("profile formatters", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("formats date-only values as calendar dates", () => {
    expect(formatDate("2028-08-12")).toBe("Aug 12, 2028");
  });

  it("keeps documents valid through their expiry date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2028, 7, 12, 23, 59));

    expect(getDocumentStatus("2028-08-12")).toEqual({
      label: "Expiring",
      tone: "warning",
    });
  });

  it("marks documents expired after their expiry date", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2028, 7, 13));

    expect(getDocumentStatus("2028-08-12")).toEqual({
      label: "Expired",
      tone: "danger",
    });
  });
});
