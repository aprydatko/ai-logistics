import { describe, expect, it, vi } from "vitest";

import { deleteDocument, updateDocument } from "./document-mutations";

const document = {
  id: "10000000-0000-4000-8000-000000000001",
  fileName: "bill-of-lading.pdf",
  fileSize: 2048,
  type: "proof_of_delivery",
  status: "needs_review",
  driver: null,
  load: null,
  uploadedAt: "2026-06-14T10:00:00.000Z",
  createdAt: "2026-06-14T10:00:00.000Z",
  updatedAt: "2026-06-14T11:00:00.000Z",
} as const;

describe("document mutations", () => {
  it("patches editable document fields", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, data: document })),
    );
    vi.stubGlobal("fetch", fetchMock);
    const updates = {
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
    const fetchMock = vi.fn().mockResolvedValue(
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
});
