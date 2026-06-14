import { NotFoundException } from "@nestjs/common";
import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it, vi } from "vitest";

import type { DocumentRecord } from "../../db/schema";
import { DocumentsService } from "./documents.service";

const document: DocumentRecord = {
  id: "11111111-1111-4111-8111-111111111111",
  fileName: "bol-1001.pdf",
  fileSize: 2048,
  type: "bill_of_lading",
  status: "needs_review",
  driverId: "22222222-2222-4222-8222-222222222222",
  loadId: "33333333-3333-4333-8333-333333333333",
  uploadedAt: new Date("2026-06-10T10:00:00.000Z"),
  createdAt: new Date("2026-06-10T10:00:00.000Z"),
  updatedAt: new Date("2026-06-11T10:00:00.000Z"),
};

const joined = {
  document,
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

describe("DocumentsService", () => {
  it("lists joined documents with pagination and ISO dates", async () => {
    const rows = makeSelectChain([joined]);
    const totals = makeSelectChain([{ total: 1 }]);
    const client = {
      select: vi.fn().mockReturnValueOnce(rows).mockReturnValueOnce(totals),
    };
    const service = new DocumentsService({ client } as never);

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
          type: document.type,
          status: document.status,
          driver: joined.driver,
          load: joined.load,
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
    const service = new DocumentsService({ client } as never);

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
      const service = new DocumentsService({ client } as never);

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
    const service = new DocumentsService({ client } as never);

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
    const row = { document: { ...document, driverId: null, loadId: null }, driver: null, load: null };
    const select = makeSelectChain([row]);
    const client = { select: vi.fn().mockReturnValue(select) };
    const service = new DocumentsService({ client } as never);

    const result = await service.findOne(document.id);

    expect(result.data.driver).toBeNull();
    expect(result.data.load).toBeNull();
  });

  it("returns not found for a missing document", async () => {
    const client = { select: vi.fn().mockReturnValue(makeSelectChain([])) };
    const service = new DocumentsService({ client } as never);

    await expect(service.findOne(document.id)).rejects.toThrow(NotFoundException);
  });

  it("returns not found for an unknown related driver", async () => {
    const client = { select: vi.fn().mockReturnValue(makeSelectChain([])) };
    const service = new DocumentsService({ client } as never);

    await expect(
      service.update(document.id, { driverId: document.driverId }),
    ).rejects.toThrow(NotFoundException);
  });

  it("returns not found for an unknown related load", async () => {
    const client = { select: vi.fn().mockReturnValue(makeSelectChain([])) };
    const service = new DocumentsService({ client } as never);

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
    const service = new DocumentsService({ client } as never);

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
    const client = {
      select: vi.fn().mockReturnValueOnce(relation).mockReturnValueOnce(detail),
      update: vi.fn().mockReturnValue(updateChain),
    };
    const service = new DocumentsService({ client } as never);

    await expect(
      service.update(document.id, {
        status: "complete",
        driverId: document.driverId,
      }),
    ).resolves.toMatchObject({ success: true, data: { id: document.id } });
    expect(updateChain.set).toHaveBeenCalledWith({
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
    const service = new DocumentsService({ client } as never);

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
    const service = new DocumentsService({ client } as never);

    await expect(service.remove(document.id)).rejects.toThrow(NotFoundException);
  });
});
