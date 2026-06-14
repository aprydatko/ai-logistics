import { describe, expect, it } from "vitest";

import { formatDocumentFileSize, formatDocumentType } from "./types";

describe("document presentation", () => {
  it("formats API document types", () => {
    expect(formatDocumentType("bill_of_lading")).toBe("Bill of Lading");
    expect(formatDocumentType("proof_of_delivery")).toBe("Proof of Delivery");
  });

  it("formats file sizes", () => {
    expect(formatDocumentFileSize(245 * 1024)).toBe("245 KB");
    expect(formatDocumentFileSize(2 * 1024 * 1024)).toBe("2 MB");
  });
});
