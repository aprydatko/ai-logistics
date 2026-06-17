import { BadRequestException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { DocumentsService } from "./documents.service";

const withTransaction = <T extends Record<string, unknown>>(client: T): T => ({
  ...client,
  transaction: vi.fn(async (callback: (tx: T) => Promise<unknown>) =>
    callback(client),
  ),
});

describe("DocumentsService upload", () => {
  it("rejects missing file uploads", async () => {
    const service = new DocumentsService(
      { client: {} } as never,
      {} as never,
      {} as never,
      {} as never,
      { createDocumentProcessingNotifications: vi.fn() } as never,
      {} as never,
    );

    await expect(
      service.upload(undefined, { type: "bill_of_lading" }, "user-id"),
    ).rejects.toThrow(BadRequestException);
  });

  it("creates a stored document with extracted fields", async () => {
    const insertDocumentReturning = vi
      .fn()
      .mockResolvedValue([{ id: "11111111-1111-4111-8111-111111111111" }]);
    const insertDocumentValues = vi.fn().mockReturnValue({
      returning: insertDocumentReturning,
    });
    const insertAuditValues = vi.fn().mockResolvedValue(undefined);
    const insertFieldsValues = vi.fn().mockResolvedValue(undefined);
    const client = withTransaction({
      insert: vi
        .fn()
        .mockReturnValueOnce({ values: insertDocumentValues })
        .mockReturnValueOnce({ values: insertAuditValues })
        .mockReturnValueOnce({ values: insertFieldsValues })
        .mockReturnValueOnce({ values: insertAuditValues }),
    });
    const storage = {
      save: vi.fn().mockResolvedValue({
        fileUrl: "/documents/2026-06-16/test.pdf",
        storagePath: "D:\\uploads\\test.pdf",
      }),
    };
    const vision = {
      analyze: vi.fn().mockResolvedValue({
        extractionModel: "gpt-4.1-mini",
        extractedFields: [
          {
            fieldKey: "bol_number",
            label: "BOL Number",
            rawValue: "12345",
            normalizedValue: "12345",
            confidence: 97,
            status: "extracted",
          },
        ],
      }),
    };
    const service = new DocumentsService(
      { client } as never,
      storage as never,
      vision as never,
      { emitDocumentProcessingUpdated: vi.fn() } as never,
      { createDocumentProcessingNotifications: vi.fn() } as never,
      { add: vi.fn() } as never,
    );
    const findOneSpy = vi.spyOn(service, "findOne").mockResolvedValue({
      success: true,
      data: { id: "11111111-1111-4111-8111-111111111111" } as never,
    });

    const file = {
      originalname: "bol.pdf",
      mimetype: "application/pdf",
      size: 1024,
      buffer: Buffer.from("pdf"),
    } as Express.Multer.File;

    await expect(
      service.upload(file, { type: "bill_of_lading" }, "user-id"),
    ).resolves.toEqual({
      success: true,
      data: { id: "11111111-1111-4111-8111-111111111111" },
    });

    expect(storage.save).toHaveBeenCalledWith(file);
    expect(vision.analyze).toHaveBeenCalledWith(file);
    expect(insertDocumentValues).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: "bol.pdf",
        fileSize: 1024,
        mimeType: "application/pdf",
        fileUrl: "/documents/2026-06-16/test.pdf",
        storagePath: "D:\\uploads\\test.pdf",
        type: "bill_of_lading",
        status: "needs_review",
      }),
    );
    expect(insertFieldsValues).toHaveBeenCalledWith([
      expect.objectContaining({
        fieldKey: "bol_number",
        label: "BOL Number",
      }),
    ]);
    expect(findOneSpy).toHaveBeenCalledWith(
      "11111111-1111-4111-8111-111111111111",
    );
  });
});
