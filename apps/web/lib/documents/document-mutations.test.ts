import { describe, expect, it, vi } from "vitest";

import {
  deleteDocument,
  replaceDocumentAuditEvents,
  replaceDocumentExtractedFields,
  updateDocument,
  uploadDocument,
} from "./document-mutations";

const document = {
  id: "10000000-0000-4000-8000-000000000001",
  fileName: "bill-of-lading.pdf",
  fileSize: 2048,
  fileUrl: null,
  mimeType: "application/pdf",
  storage: {
    provider: "local",
    bucket: null,
    objectKey: null,
    etag: null,
  },
  pageCount: null,
  extractionModel: null,
  processingTimeMs: null,
  type: "proof_of_delivery",
  status: "needs_review",
  uploadedBy: null,
  driver: null,
  load: null,
  extractedFields: [],
  auditEvents: [],
  uploadedAt: "2026-06-14T10:00:00.000Z",
  createdAt: "2026-06-14T10:00:00.000Z",
  updatedAt: "2026-06-14T11:00:00.000Z",
} as const;

describe("document mutations", () => {
  it("patches editable document fields", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ success: true, data: document })),
      );
    vi.stubGlobal("fetch", fetchMock);
    const updates = {
      fileName: document.fileName,
      mimeType: document.mimeType,
      extractionModel: document.extractionModel,
      pageCount: document.pageCount,
      processingTimeMs: document.processingTimeMs,
      type: "proof_of_delivery",
      status: "needs_review",
      driverId: null,
      loadId: null,
    } as const;

    await expect(
      updateDocument({ documentId: document.id, updates }),
    ).resolves.toEqual(document);
    expect(fetchMock).toHaveBeenCalledWith(`/api/documents/${document.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
  });

  it("hard deletes a document", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ success: true, data: { id: document.id } }),
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(deleteDocument(document.id)).resolves.toEqual({
      id: document.id,
    });
    expect(fetchMock).toHaveBeenCalledWith(`/api/documents/${document.id}`, {
      method: "DELETE",
    });
  });

  it("replaces extracted fields", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ success: true, data: document })),
      );
    vi.stubGlobal("fetch", fetchMock);
    const fields = [
      {
        fieldKey: "bol_number",
        label: "BOL number",
        rawValue: "78291",
        normalizedValue: "78291",
        confidence: 99,
        status: "edited" as const,
      },
    ];

    await expect(
      replaceDocumentExtractedFields({ documentId: document.id, fields }),
    ).resolves.toEqual(document);
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/documents/${document.id}/extracted-fields`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      },
    );
  });

  it("replaces audit events", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ success: true, data: document })),
      );
    vi.stubGlobal("fetch", fetchMock);
    const events = [
      {
        kind: "custom" as const,
        label: "Reviewed by dispatcher",
        actor: "Alex Dispatcher",
        actorBadge: "AD",
        role: "Operator",
        tone: "navy" as const,
        timestamp: "2026-06-14T10:00:00.000Z",
      },
    ];

    await expect(
      replaceDocumentAuditEvents({ documentId: document.id, events }),
    ).resolves.toEqual(document);
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/documents/${document.id}/audit-events`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ events }),
      },
    );
  });

  it("extracts typed API error messages with a fallback", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ message: "Document is locked" }), {
            status: 409,
          }),
        )
        .mockResolvedValueOnce(
          new Response("not-json", {
            status: 500,
          }),
        ),
    );

    await expect(deleteDocument(document.id)).rejects.toThrow(
      "Document is locked",
    );
    await expect(deleteDocument(document.id)).rejects.toThrow(
      "Unable to delete document",
    );
  });

  it("fails fast locally when presigned uploads are unavailable", async () => {
    vi.stubGlobal("fetch", async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "/api/documents/uploads/initiate") {
        return new Response(
          JSON.stringify({
            message:
              "Direct uploads require S3-compatible storage to be configured",
          }),
          { status: 400 },
        );
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    vi.stubGlobal("window", {
      location: { hostname: "localhost" },
    } as Window & typeof globalThis);

    await expect(
      uploadDocument({
        file: new File(["pdf"], "local-test.pdf", {
          type: "application/pdf",
        }),
        type: "bill_of_lading",
      }),
    ).rejects.toThrow(
      "Presigned document upload is unavailable locally. Fix the MinIO/S3 configuration instead of falling back to the legacy upload route.",
    );
  });

  it("keeps legacy fallback outside local environments when direct uploads are unavailable", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url === "/api/documents/uploads/initiate") {
        return new Response(
          JSON.stringify({
            message:
              "Direct uploads require S3-compatible storage to be configured",
          }),
          { status: 400 },
        );
      }

      if (url === "/api/documents/upload") {
        return new Response(JSON.stringify({ success: true, data: document }));
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", {
      location: { hostname: "example.com" },
    } as Window & typeof globalThis);

    await expect(
      uploadDocument({
        file: new File(["pdf"], "remote-test.pdf", {
          type: "application/pdf",
        }),
        type: "bill_of_lading",
      }),
    ).resolves.toEqual(document);

    expect(fetchMock).toHaveBeenCalledWith("/api/documents/upload", {
      method: "POST",
      body: expect.any(FormData),
    });
  });
});
