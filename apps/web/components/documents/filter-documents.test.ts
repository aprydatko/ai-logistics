import { describe, expect, it } from "vitest";

import { filterDocuments } from "./filter-documents";
import { mockDocuments } from "./mock-documents";

const allFilters = {
  search: "",
  driver: "all",
  type: "all",
  status: "all",
} as const;

describe("filterDocuments", () => {
  it("searches document fields case-insensitively", () => {
    const result = filterDocuments(mockDocuments, {
      ...allFilters,
      search: "JOHN SMITH",
    });

    expect(result).toHaveLength(2);
    expect(result.every(({ driver }) => driver === "John Smith")).toBe(true);
  });

  it("combines driver, type, and status filters", () => {
    const result = filterDocuments(mockDocuments, {
      ...allFilters,
      driver: "John Smith",
      type: "Bill of Lading",
      status: "complete",
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      driver: "John Smith",
      type: "Bill of Lading",
      status: "complete",
    });
  });

  it("searches by load and document type", () => {
    expect(
      filterDocuments(mockDocuments, {
        ...allFilters,
        search: "ld-78104",
      }),
    ).toHaveLength(1);
    expect(
      filterDocuments(mockDocuments, {
        ...allFilters,
        search: "proof of delivery",
      }).length,
    ).toBeGreaterThan(1);
  });

  it("returns an empty collection when nothing matches", () => {
    expect(
      filterDocuments(mockDocuments, {
        ...allFilters,
        search: "missing document",
      }),
    ).toEqual([]);
  });
});
