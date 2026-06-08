import { afterEach, describe, expect, it, vi } from "vitest";

import {
  formatDate,
  formatTimestamp,
  getDocumentStatus,
} from "./profile-formatters";

describe("profile formatters", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("formats date-only values as calendar dates", () => {
    expect(formatDate("2028-08-12")).toBe("Aug 12, 2028");
  });

  it("formats activity timestamps", () => {
    expect(formatTimestamp("2026-06-07T15:20:00Z")).toMatch(
      /^Jun 7, 2026, \d{1,2}:20 (AM|PM)$/,
    );
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
