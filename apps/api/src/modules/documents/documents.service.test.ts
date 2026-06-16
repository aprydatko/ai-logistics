import { NotFoundException } from "@nestjs/common";
import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it, vi } from "vitest";

import type {
  DocumentAuditEventRecord,
  DocumentExtractedFieldRecord,
  DocumentRecord,
} from "../../db/schema";
import { DocumentsService } from "./documents.service";

const document: DocumentRecord = {
  id: "11111111-1111-4111-8111-111111111111",
  fileName: "bol-1001.pdf",
  fileSize: 2048,
  mimeType: "application/pdf",
  fileUrl: null,
  storagePath: null,
  type: "bill_of_lading",
  status: "needs_review",
  uploadedByUserId: "44444444-4444-4444-8444-444444444444",
  pageCount: 2,
  extractionModel: "Document Extractor v2.1",
  processingTimeMs: 4200,
  driverId: "22222222-2222-4222-8222-222222222222",
  loadId: "33333333-3333-4333-8333-333333333333",
  uploadedAt: new Date("2026-06-10T10:00:00.000Z"),
  createdAt: new Date("2026-06-10T10:00:00.000Z"),
  updatedAt: new Date("2026-06-11T10:00:00.000Z"),
};

const joined = {
  document,
  fileUrl: null,
  driverDocumentMimeType: null,
  uploadedBy: {
    id: document.uploadedByUserId,
    firstName: "Alex",
    lastName: "Dispatcher",
  },
  driver: {
    id: document.driverId,
    firstName: "Alex",
    lastName: "Morgan",
  },
  load: {
    id: document.loadId,
    referenceNumber: "LD-1001",
  },
};

const extractedField: DocumentExtractedFieldRecord = {
  id: "55555555-5555-4555-8555-555555555555",
  documentId: document.id,
  fieldKey: "bol_number",
  label: "BOL number",
  rawValue: "78291",
  normalizedValue: "78291",
  confidence: 99,
  status: "extracted",
  extractedAt: new Date("2026-06-10T10:00:00.000Z"),
  extractedByUserId: null,
  reviewedAt: null,
  reviewedByUserId: null,
  createdAt: new Date("2026-06-10T10:00:00.000Z"),
  updatedAt: new Date("2026-06-10T10:00:00.000Z"),
};

const auditEvent: DocumentAuditEventRecord = {
  id: "66666666-6666-4666-8666-666666666666",
  documentId: document.id,
  kind: "custom",
  label: "Reviewed by dispatcher",
  actor: "Alex Dispatcher",
  actorBadge: "AD",
  role: "Operator",
  tone: "navy",
  eventAt: new Date("2026-06-10T10:05:00.000Z"),
  createdAt: new Date("2026-06-10T10:05:00.000Z"),
  updatedAt: new Date("2026-06-10T10:05:00.000Z"),
};

const makeSelectChain = (result: unknown) => {
  const chain = {
    from: vi.fn(),
    leftJoin: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    offset: vi.fn(),
    then: (
      resolve: (value: unknown) => unknown,
      reject?: (reason: unknown) => unknown,
    ) => Promise.resolve(result).then(resolve, reject),
  };
  chain.from.mockReturnValue(chain);
  chain.leftJoin.mockReturnValue(chain);
  chain.where.mockReturnValue(chain);
  chain.orderBy.mockReturnValue(chain);
  chain.limit.mockReturnValue(chain);
  chain.offset.mockReturnValue(chain);
  return chain;
};

const sqlText = (sql: SQL | undefined): string =>
  sql ? new PgDialect().sqlToQuery(sql).sql : "";

const withTransaction = <T extends Record<string, unknown>>(client: T): T => ({
  ...client,
  transaction: vi.fn(async (callback: (tx: T) => Promise<unknown>) =>
    callback(client),
  ),
});

const createService = (client: unknown): DocumentsService =>
  new DocumentsService(client as never, {} as never, {} as never);

describe("DocumentsService", () => {
  it("lists joined documents with pagination and ISO dates", async () => {
    const rows = makeSelectChain([joined]);
    const totals = makeSelectChain([{ total: 1 }]);
    const client = {
      select: vi.fn().mockReturnValueOnce(rows).mockReturnValueOnce(totals),
    };
    const service = createService({ client });

    await expect(
      service.findAll({
        page: 1,
        limit: 20,
        sortBy: "uploadedAt",
        sortOrder: "desc",
      }),
    ).resolves.toEqual({
      success: true,
      data: [
        {
          id: document.id,
          fileName: document.fileName,
          fileSize: document.fileSize,
          fileUrl: null,
          mimeType: document.mimeType,
          pageCount: document.pageCount,
          extractionModel: document.extractionModel,
          processingTimeMs: document.processingTimeMs,
          type: document.type,
          status: document.status,
          uploadedBy: joined.uploadedBy,
          driver: joined.driver,
          load: joined.load,
          extractedFields: [],
          auditEvents: [],
          uploadedAt: document.uploadedAt.toISOString(),
          createdAt: document.createdAt.toISOString(),
          updatedAt: document.updatedAt.toISOString(),
        },
      ],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
  });

  it("applies filters, label search, sorting, and pagination in the database", async () => {
    const rows = makeSelectChain([]);
    const totals = makeSelectChain([{ total: 0 }]);
    const client = {
      select: vi.fn().mockReturnValueOnce(rows).mockReturnValueOnce(totals),
    };
    const service = createService({ client });

    await service.findAll({
      search: "Proof of Delivery",
      driverId: document.driverId!,
      loadId: document.loadId!,
      type: "proof_of_delivery",
      status: "complete",
      page: 3,
      limit: 10,
      sortBy: "fileName",
      sortOrder: "asc",
    });

    const listWhere = rows.where.mock.calls[0]?.[0] as SQL;
    const countWhere = totals.where.mock.calls[0]?.[0] as SQL;
    expect(sqlText(listWhere)).toContain('"documents"."type" = $');
    expect(sqlText(listWhere)).toContain('"documents"."driver_id" = $');
    expect(sqlText(listWhere)).toContain('"documents"."load_id" = $');
    expect(sqlText(listWhere)).toContain('"documents"."status" = $');
    expect(sqlText(listWhere)).toContain('"documents"."file_name" ilike $');
    expect(sqlText(countWhere)).toBe(sqlText(listWhere));
    expect(totals.leftJoin).toHaveBeenCalledTimes(2);
    expect(rows.orderBy).toHaveBeenCalledTimes(1);
    expect(rows.limit).toHaveBeenCalledWith(10);
    expect(rows.offset).toHaveBeenCalledWith(20);
  });

  it.each([
    ["proof", "proof_of_delivery"],
    ["delivery", "proof_of_delivery"],
    ["lading", "bill_of_lading"],
    ["rate", "rate_confirmation"],
    ["license", "driver_license"],
  ] as const)(
    "maps partial normalized type term %s to enum %s",
    async (search, type) => {
      const rows = makeSelectChain([]);
      const totals = makeSelectChain([{ total: 0 }]);
      const client = {
        select: vi.fn().mockReturnValueOnce(rows).mockReturnValueOnce(totals),
      };
      const service = createService({ client });

      await service.findAll({
        search,
        page: 1,
        limit: 20,
        sortBy: "uploadedAt",
        sortOrder: "desc",
      });

      const where = rows.where.mock.calls[0]?.[0] as SQL;
      const query = new PgDialect().sqlToQuery(where);
      expect(query.params).toContain(type);
      expect(query.sql).toContain('"documents"."type" in ($');
    },
  );

  it.each([
    ["Bill of Lading", "bill_of_lading"],
    ["Proof of Delivery", "proof_of_delivery"],
    ["Rate Confirmation", "rate_confirmation"],
    ["Driver License", "driver_license"],
  ] as const)("maps type label search %s to enum %s", async (search, type) => {
    const rows = makeSelectChain([]);
    const totals = makeSelectChain([{ total: 0 }]);
    const client = {
      select: vi.fn().mockReturnValueOnce(rows).mockReturnValueOnce(totals),
    };
    const service = createService({ client });

    await service.findAll({
      search,
      page: 1,
      limit: 20,
      sortBy: "uploadedAt",
      sortOrder: "desc",
    });

    const where = rows.where.mock.calls[0]?.[0] as SQL;
    const query = new PgDialect().sqlToQuery(where);
    expect(query.sql).toContain('"documents"."type" in ($');
    expect(query.params).toContain(type);
    expect(query.sql).toContain('"documents"."file_name" ilike $');
  });

  it("maps missing joined relations to null", async () => {
    const row = {
      document: { ...document, driverId: null, loadId: null },
      fileUrl: null,
      driverDocumentMimeType: null,
      uploadedBy: null,
      driver: null,
      load: null,
    };
    const detail = makeSelectChain([row]);
    const fields = makeSelectChain([]);
    const audits = makeSelectChain([]);
    const client = {
      select: vi
        .fn()
        .mockReturnValueOnce(detail)
        .mockReturnValueOnce(fields)
        .mockReturnValueOnce(audits),
    };
    const service = createService({ client });

    const result = await service.findOne(document.id);

    expect(result.data.driver).toBeNull();
    expect(result.data.load).toBeNull();
    expect(result.data.extractedFields).toEqual([]);
    expect(result.data.auditEvents).toEqual([]);
  });

  it("returns extracted fields on detail responses", async () => {
    const detail = makeSelectChain([joined]);
    const fields = makeSelectChain([extractedField]);
    const audits = makeSelectChain([]);
    const client = {
      select: vi
        .fn()
        .mockReturnValueOnce(detail)
        .mockReturnValueOnce(fields)
        .mockReturnValueOnce(audits),
    };
    const service = createService({ client });

    const result = await service.findOne(document.id);

    expect(result.data.extractedFields).toEqual([
      {
        ...extractedField,
        extractedAt: extractedField.extractedAt.toISOString(),
        reviewedAt: null,
        createdAt: extractedField.createdAt.toISOString(),
        updatedAt: extractedField.updatedAt.toISOString(),
      },
    ]);
  });

  it("returns audit events on detail responses", async () => {
    const detail = makeSelectChain([joined]);
    const fields = makeSelectChain([]);
    const audits = makeSelectChain([auditEvent]);
    const client = {
      select: vi
        .fn()
        .mockReturnValueOnce(detail)
        .mockReturnValueOnce(fields)
        .mockReturnValueOnce(audits),
    };
    const service = createService({ client });

    const result = await service.findOne(document.id);

    expect(result.data.auditEvents).toEqual([
      {
        id: auditEvent.id,
        kind: auditEvent.kind,
        label: auditEvent.label,
        actor: auditEvent.actor,
        actorBadge: auditEvent.actorBadge,
        role: auditEvent.role,
        tone: auditEvent.tone,
        timestamp: auditEvent.eventAt!.toISOString(),
        createdAt: auditEvent.createdAt.toISOString(),
        updatedAt: auditEvent.updatedAt.toISOString(),
      },
    ]);
  });

  it("returns not found for a missing document", async () => {
    const client = { select: vi.fn().mockReturnValue(makeSelectChain([])) };
    const service = createService({ client });

    await expect(service.findOne(document.id)).rejects.toThrow(
      NotFoundException,
    );
  });

  it("returns not found for an unknown related driver", async () => {
    const client = { select: vi.fn().mockReturnValue(makeSelectChain([])) };
    const service = createService({ client });

    await expect(
      service.update(document.id, { driverId: document.driverId }),
    ).rejects.toThrow(NotFoundException);
  });

  it("returns not found for an unknown related load", async () => {
    const client = { select: vi.fn().mockReturnValue(makeSelectChain([])) };
    const service = createService({ client });

    await expect(
      service.update(document.id, { loadId: document.loadId }),
    ).rejects.toThrow(NotFoundException);
  });

  it("returns not found when updating a missing document", async () => {
    const updateChain = {
      set: vi.fn(),
      where: vi.fn(),
      returning: vi.fn().mockResolvedValue([]),
    };
    updateChain.set.mockReturnValue(updateChain);
    updateChain.where.mockReturnValue(updateChain);
    const client = { update: vi.fn().mockReturnValue(updateChain) };
    const service = createService({ client });

    await expect(
      service.update(document.id, { status: "complete" }),
    ).rejects.toThrow(NotFoundException);
  });

  it("updates allowed fields and returns the refreshed document", async () => {
    const relation = makeSelectChain([{ id: document.driverId }]);
    const updateChain = {
      set: vi.fn(),
      where: vi.fn(),
      returning: vi.fn().mockResolvedValue([document]),
    };
    updateChain.set.mockReturnValue(updateChain);
    updateChain.where.mockReturnValue(updateChain);
    const detail = makeSelectChain([joined]);
    const fields = makeSelectChain([]);
    const audits = makeSelectChain([]);
    const client = {
      select: vi
        .fn()
        .mockReturnValueOnce(relation)
        .mockReturnValueOnce(detail)
        .mockReturnValueOnce(fields)
        .mockReturnValueOnce(audits),
      update: vi.fn().mockReturnValue(updateChain),
    };
    const service = createService({ client });

    await expect(
      service.update(document.id, {
        fileName: "bol-1001-reviewed.pdf",
        mimeType: "image/png",
        extractionModel: "Document Extractor v3.0",
        pageCount: 3,
        processingTimeMs: 5100,
        status: "complete",
        driverId: document.driverId,
      }),
    ).resolves.toMatchObject({ success: true, data: { id: document.id } });
    expect(updateChain.set).toHaveBeenCalledWith({
      fileName: "bol-1001-reviewed.pdf",
      mimeType: "image/png",
      extractionModel: "Document Extractor v3.0",
      pageCount: 3,
      processingTimeMs: 5100,
      status: "complete",
      driverId: document.driverId,
      updatedAt: expect.any(Date),
    });
  });

  it("hard deletes a document and returns its id", async () => {
    const deleteChain = {
      where: vi.fn(),
      returning: vi.fn().mockResolvedValue([{ id: document.id }]),
    };
    deleteChain.where.mockReturnValue(deleteChain);
    const client = { delete: vi.fn().mockReturnValue(deleteChain) };
    const service = createService({ client });

    await expect(service.remove(document.id)).resolves.toEqual({
      success: true,
      data: { id: document.id },
    });
  });

  it("returns not found when deleting a missing document", async () => {
    const deleteChain = {
      where: vi.fn(),
      returning: vi.fn().mockResolvedValue([]),
    };
    deleteChain.where.mockReturnValue(deleteChain);
    const client = { delete: vi.fn().mockReturnValue(deleteChain) };
    const service = createService({ client });

    await expect(service.remove(document.id)).rejects.toThrow(
      NotFoundException,
    );
  });

  it("replaces extracted fields and returns the refreshed document", async () => {
    const existsBefore = makeSelectChain([{ id: document.id }]);
    const detailAfter = makeSelectChain([joined]);
    const fieldsAfter = makeSelectChain([extractedField]);
    const auditsAfter = makeSelectChain([]);
    const deleteChain = {
      where: vi.fn().mockResolvedValue([]),
    };
    deleteChain.where.mockReturnValue(deleteChain);
    const insertChain = {
      values: vi.fn().mockResolvedValue([]),
    };
    const client = withTransaction({
      select: vi
        .fn()
        .mockReturnValueOnce(existsBefore)
        .mockReturnValueOnce(detailAfter)
        .mockReturnValueOnce(fieldsAfter)
        .mockReturnValueOnce(auditsAfter),
      delete: vi.fn().mockReturnValue(deleteChain),
      insert: vi.fn().mockReturnValue(insertChain),
    });
    const service = createService({ client });

    const result = await service.replaceExtractedFields(document.id, [
      {
        fieldKey: "bol_number",
        label: "BOL number",
        rawValue: "78291",
        normalizedValue: "78291",
        confidence: 99,
        status: "edited",
      },
    ]);

    expect(client.delete).toHaveBeenCalled();
    expect(deleteChain.where).toHaveBeenCalled();
    expect(client.insert).toHaveBeenCalled();
    expect(insertChain.values).toHaveBeenCalledWith([
      expect.objectContaining({
        documentId: document.id,
        fieldKey: "bol_number",
        label: "BOL number",
        rawValue: "78291",
        normalizedValue: "78291",
        confidence: 99,
        status: "edited",
      }),
    ]);
    expect(result.data.extractedFields).toHaveLength(1);
  });

  it("replaces audit events and returns the refreshed document", async () => {
    const existsBefore = makeSelectChain([{ id: document.id }]);
    const deleteChain = {
      where: vi.fn().mockResolvedValue([]),
    };
    deleteChain.where.mockReturnValue(deleteChain);
    const insertChain = {
      values: vi.fn().mockResolvedValue([]),
    };
    const detailAfter = makeSelectChain([joined]);
    const fieldsAfter = makeSelectChain([]);
    const auditsAfter = makeSelectChain([auditEvent]);
    const client = withTransaction({
      select: vi
        .fn()
        .mockReturnValueOnce(existsBefore)
        .mockReturnValueOnce(detailAfter)
        .mockReturnValueOnce(fieldsAfter)
        .mockReturnValueOnce(auditsAfter),
      delete: vi.fn().mockReturnValue(deleteChain),
      insert: vi.fn().mockReturnValue(insertChain),
    });
    const service = createService({ client });

    const result = await service.replaceAuditEvents(document.id, [
      {
        kind: "custom",
        label: "Reviewed by dispatcher",
        actor: "Alex Dispatcher",
        actorBadge: "AD",
        role: "Operator",
        tone: "navy",
        timestamp: "2026-06-10T10:05:00.000Z",
      },
    ]);

    expect(client.delete).toHaveBeenCalled();
    expect(client.insert).toHaveBeenCalled();
    expect(insertChain.values).toHaveBeenCalledWith([
      expect.objectContaining({
        documentId: document.id,
        kind: "custom",
        label: "Reviewed by dispatcher",
        actor: "Alex Dispatcher",
        actorBadge: "AD",
        role: "Operator",
        tone: "navy",
      }),
    ]);
    expect(result.data.auditEvents).toHaveLength(1);
  });
});
