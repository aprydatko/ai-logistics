import "reflect-metadata";

import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { describe, expect, it } from "vitest";

import { ListDocumentsQueryDto } from "./list-documents-query.dto";
import { UpdateDocumentDto } from "./update-document.dto";

describe("Documents DTO validation", () => {
  it("transforms list defaults and numeric pagination", async () => {
    const dto = plainToInstance(ListDocumentsQueryDto, {
      search: "  invoice  ",
      page: "2",
      limit: "25",
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto).toMatchObject({
      search: "invoice",
      page: 2,
      limit: 25,
      sortBy: "uploadedAt",
      sortOrder: "desc",
    });
  });

  it.each([
    { type: "invoice" },
    { status: "archived" },
    { driverId: "not-a-uuid" },
    { loadId: "not-a-uuid" },
    { sortBy: "createdAt" },
    { sortOrder: "sideways" },
    { page: "0" },
    { limit: "101" },
  ])("rejects invalid list query %#", async (input) => {
    const dto = plainToInstance(ListDocumentsQueryDto, input);

    expect(await validate(dto)).not.toHaveLength(0);
  });

  it("accepts nullable relations in updates", async () => {
    const dto = plainToInstance(UpdateDocumentDto, {
      type: "proof_of_delivery",
      status: "complete",
      driverId: null,
      loadId: null,
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it("rejects immutable update fields", async () => {
    const dto = plainToInstance(UpdateDocumentDto, {
      fileSize: 1,
      uploadedAt: "2026-06-14T00:00:00.000Z",
    });

    const errors = await validate(dto, {
      forbidNonWhitelisted: true,
      whitelist: true,
    });

    expect(errors.map(({ property }) => property)).toEqual(
      expect.arrayContaining(["fileSize", "uploadedAt"]),
    );
  });
});
