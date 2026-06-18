import { describe, expect, it, vi } from "vitest";

import {
  documentsQueryOptions,
  fetchDocument,
  fetchDocuments,
} from "./documents-query";

const document = {
  id: "10000000-0000-4000-8000-000000000001",
  fileName: "bill-of-lading.pdf",
  fileSize: 2048,
  fileUrl: "data:application/pdf;base64,JVBERi0xLjQ=",
  mimeType: "application/pdf",
  storage: {
    provider: "s3",
    bucket: "documents",
    objectKey: "documents/2026-06-18/test.pdf",
    etag: "etag-1",
  },
  pageCount: 2,
  extractionModel: "Document Extractor v2.1",
  processingTimeMs: 4200,
  type: "bill_of_lading",
  status: "complete",
  uploadedBy: {
    id: "40000000-0000-4000-8000-000000000001",
    firstName: "Alex",
    lastName: "Dispatcher",
  },
  driver: {
    id: "20000000-0000-4000-8000-000000000001",
    firstName: "Ada",
    lastName: "Lovelace",
  },
  load: {
    id: "30000000-0000-4000-8000-000000000001",
    referenceNumber: "LD-1001",
  },
  extractedFields: [
    {
      id: "50000000-0000-4000-8000-000000000001",
      fieldKey: "bol_number",
      label: "BOL number",
      rawValue: "78291",
      normalizedValue: "78291",
      confidence: 99,
      status: "extracted",
      extractedAt: "2026-06-14T10:00:00.000Z",
      reviewedAt: null,
      createdAt: "2026-06-14T10:00:00.000Z",
      updatedAt: "2026-06-14T10:00:00.000Z",
    },
  ],
  auditEvents: [],
  uploadedAt: "2026-06-14T10:00:00.000Z",
  createdAt: "2026-06-14T10:00:00.000Z",
  updatedAt: "2026-06-14T10:00:00.000Z",
} as const;

describe("documents query", () => {
  it("serializes all supported list filters", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: [document],
          pagination: { page: 2, limit: 25, total: 26, totalPages: 2 },
        }),
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await fetchDocuments({
      search: "bill",
      driverId: document.driver.id,
      loadId: document.load.id,
      type: "bill_of_lading",
      status: "complete",
      sortBy: "fileName",
      sortOrder: "asc",
      page: 2,
      limit: 25,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/documents?search=bill&driverId=${document.driver.id}&loadId=${document.load.id}&type=bill_of_lading&status=complete&sortBy=fileName&sortOrder=asc&page=2&limit=25`,
    );
  });

  it("validates list and detail responses at runtime", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              success: true,
              data: [{ ...document, fileSize: "2048" }],
              pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
            }),
          ),
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ success: true, data: document })),
        ),
    );

    await expect(fetchDocuments({ page: 1, limit: 10 })).rejects.toThrow();
    await expect(fetchDocument(document.id)).resolves.toEqual(document);
  });

  it("keeps previous list data and uses typed query keys", () => {
    const filters = { page: 1, limit: 10 } as const;
    const listOptions = documentsQueryOptions(filters);

    expect(listOptions.queryKey).toEqual(["documents", filters]);
    expect(listOptions.placeholderData).toBeTypeOf("function");
  });
});
