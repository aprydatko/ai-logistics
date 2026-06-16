import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  or,
  type AnyColumn,
  type SQL,
} from "drizzle-orm";

import { DatabaseService } from "../../db/database.service";
import {
  documentAuditEvents,
  documents,
  documentExtractedFields,
  driverDocuments,
  drivers,
  loads,
  users,
  type DocumentRecord,
} from "../../db/schema";
import { DocumentStorageService } from "./document-storage.service";
import { DocumentVisionService } from "./document-vision.service";
import type { ListDocumentsQueryDto } from "./dto/list-documents-query.dto";
import type { CreateDocumentDto } from "./dto/create-document.dto";
import type { UpdateDocumentAuditEventDto } from "./dto/update-document-audit-event.dto";
import type { UpdateDocumentDto } from "./dto/update-document.dto";
import type { UpdateDocumentExtractedFieldDto } from "./dto/update-document-extracted-field.dto";
import type { UploadDocumentDto } from "./dto/upload-document.dto";
import type {
  DocumentAuditEventItem,
  DocumentExtractedFieldItem,
  DeleteDocumentResult,
  DocumentItem,
  DocumentResult,
  DocumentsListResult,
} from "./documents.types";

type DriverSummary = DocumentItem["driver"];
type LoadSummary = DocumentItem["load"];
type DocumentType = DocumentRecord["type"];

const documentTypeLabels: Array<[string, DocumentType]> = [
  ["bill of lading", "bill_of_lading"],
  ["proof of delivery", "proof_of_delivery"],
  ["rate confirmation", "rate_confirmation"],
  ["driver license", "driver_license"],
];

@Injectable()
export class DocumentsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly documentStorageService: DocumentStorageService,
    private readonly documentVisionService: DocumentVisionService,
  ) {}

  async findAll(query: ListDocumentsQueryDto): Promise<DocumentsListResult> {
    const filters = this.buildFilters(query);
    const where = filters.length > 0 ? and(...filters) : undefined;
    const sortColumn = this.sortColumn(query.sortBy);
    const direction = query.sortOrder === "asc" ? asc : desc;
    const [rows, totalRows] = await Promise.all([
      this.baseSelect()
        .where(where)
        .orderBy(direction(sortColumn), desc(documents.id))
        .limit(query.limit)
        .offset((query.page - 1) * query.limit),
      this.databaseService.client
        .select({ total: count() })
        .from(documents)
        .leftJoin(drivers, eq(documents.driverId, drivers.id))
        .leftJoin(loads, eq(documents.loadId, loads.id))
        .where(where),
    ]);
    const total = totalRows[0]?.total ?? 0;

    return {
      success: true,
      data: rows.map((row) =>
        this.toDocument(
          row.document,
          row.driver,
          row.load,
          row.document.fileUrl ?? row.driverDocumentFileUrl,
          row.document.mimeType ?? row.driverDocumentMimeType,
          row.uploadedBy,
          [],
          [],
        ),
      ),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async findOne(id: string): Promise<DocumentResult> {
    const [row] = await this.baseSelect().where(eq(documents.id, id)).limit(1);

    if (!row) throw new NotFoundException("Document was not found");
    const extractedFields = await this.databaseService.client
      .select()
      .from(documentExtractedFields)
      .where(eq(documentExtractedFields.documentId, id))
      .orderBy(asc(documentExtractedFields.createdAt));
    const auditEvents = await this.databaseService.client
      .select()
      .from(documentAuditEvents)
      .where(eq(documentAuditEvents.documentId, id))
      .orderBy(asc(documentAuditEvents.createdAt));

    return {
      success: true,
      data: this.toDocument(
        row.document,
        row.driver,
        row.load,
        row.document.fileUrl ?? row.driverDocumentFileUrl,
        row.document.mimeType ?? row.driverDocumentMimeType,
        row.uploadedBy,
        extractedFields.map((field) => this.toDocumentExtractedField(field)),
        auditEvents.map((event) => this.toDocumentAuditEvent(event)),
      ),
    };
  }

  async create(
    dto: CreateDocumentDto,
    uploadedByUserId: string,
  ): Promise<DocumentResult> {
    if (dto.driverId) {
      await this.assertRelationExists(drivers, dto.driverId, "Driver");
    }
    if (dto.loadId) {
      await this.assertRelationExists(loads, dto.loadId, "Load");
    }

    const [created] = await this.databaseService.client
      .insert(documents)
      .values({
        fileName: dto.fileName,
        fileSize: dto.fileSize,
        mimeType: dto.mimeType,
        fileUrl: null,
        storagePath: null,
        type: dto.type,
        status: dto.status,
        uploadedByUserId,
        driverId: dto.driverId,
        loadId: dto.loadId,
        uploadedAt: new Date(),
      })
      .returning({ id: documents.id });

    if (!created) throw new BadRequestException("Unable to create document");
    return this.findOne(created.id);
  }

  async update(id: string, dto: UpdateDocumentDto): Promise<DocumentResult> {
    if (!Object.values(dto).some((value) => value !== undefined)) {
      throw new BadRequestException("At least one field must be provided");
    }
    if (dto.driverId) {
      await this.assertRelationExists(drivers, dto.driverId, "Driver");
    }
    if (dto.loadId) {
      await this.assertRelationExists(loads, dto.loadId, "Load");
    }

    const values = {
      ...(dto.fileName !== undefined && { fileName: dto.fileName }),
      ...(dto.mimeType !== undefined && { mimeType: dto.mimeType }),
      ...(dto.extractionModel !== undefined && {
        extractionModel: dto.extractionModel,
      }),
      ...(dto.pageCount !== undefined && { pageCount: dto.pageCount }),
      ...(dto.processingTimeMs !== undefined && {
        processingTimeMs: dto.processingTimeMs,
      }),
      ...(dto.type !== undefined && { type: dto.type }),
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.driverId !== undefined && { driverId: dto.driverId }),
      ...(dto.loadId !== undefined && { loadId: dto.loadId }),
      updatedAt: new Date(),
    };
    const [updated] = await this.databaseService.client
      .update(documents)
      .set(values)
      .where(eq(documents.id, id))
      .returning({ id: documents.id });

    if (!updated) throw new NotFoundException("Document was not found");
    return this.findOne(id);
  }

  async upload(
    file: Express.Multer.File | undefined,
    dto: UploadDocumentDto,
    uploadedByUserId: string,
  ): Promise<DocumentResult> {
    if (!file) {
      throw new BadRequestException("File is required");
    }
    if (
      !["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(
        file.mimetype,
      )
    ) {
      throw new BadRequestException(
        "Only PDF, JPEG, PNG, and WEBP documents are supported",
      );
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException("Document must be 5 MB or smaller");
    }
    if (dto.driverId) {
      await this.assertRelationExists(drivers, dto.driverId, "Driver");
    }
    if (dto.loadId) {
      await this.assertRelationExists(loads, dto.loadId, "Load");
    }

    const savedFile = await this.documentStorageService.save(file);
    const startedAt = Date.now();
    const analysis =
      dto.analyzeWithVision !== false
        ? await this.documentVisionService.analyze(file)
        : null;
    const processingTimeMs = analysis ? Date.now() - startedAt : null;
    const status = analysis?.extractedFields.length ? "needs_review" : "complete";

    const [created] = await this.databaseService.client
      .insert(documents)
      .values({
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        fileUrl: savedFile.fileUrl,
        storagePath: savedFile.storagePath,
        type: dto.type,
        status,
        uploadedByUserId,
        driverId: dto.driverId,
        loadId: dto.loadId,
        extractionModel: analysis?.extractionModel ?? null,
        processingTimeMs,
        uploadedAt: new Date(),
      })
      .returning({ id: documents.id });

    if (!created) throw new BadRequestException("Unable to upload document");

    await this.databaseService.client.insert(documentAuditEvents).values({
      documentId: created.id,
      kind: "uploaded",
      label: "Document uploaded",
      actor: "System",
      actorBadge: "AI",
      role: "Platform",
      tone: "navy",
      eventAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    if (analysis?.extractedFields.length) {
      const now = new Date();
      await this.databaseService.client.insert(documentExtractedFields).values(
        analysis.extractedFields.map((field) => ({
          documentId: created.id,
          fieldKey: field.fieldKey,
          label: field.label,
          rawValue: field.rawValue,
          normalizedValue: field.normalizedValue,
          confidence: field.confidence,
          status: field.status,
          extractedAt: now,
          reviewedAt: null,
          createdAt: now,
          updatedAt: now,
        })),
      );
      await this.databaseService.client.insert(documentAuditEvents).values({
        documentId: created.id,
        kind: "ai_extraction",
        label: "Vision extracted document fields",
        actor: "OpenAI Vision",
        actorBadge: "AI",
        role: "Model",
        tone: "violet",
        eventAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }

    return this.findOne(created.id);
  }

  async replaceExtractedFields(
    id: string,
    fields: UpdateDocumentExtractedFieldDto[],
  ): Promise<DocumentResult> {
    await this.findOne(id);

    await this.databaseService.client
      .delete(documentExtractedFields)
      .where(eq(documentExtractedFields.documentId, id));

    if (fields.length > 0) {
      const now = new Date();
      await this.databaseService.client.insert(documentExtractedFields).values(
        fields.map((field) => ({
          documentId: id,
          fieldKey: field.fieldKey,
          label: field.label,
          rawValue: field.rawValue ?? null,
          normalizedValue: field.normalizedValue ?? null,
          confidence: field.confidence ?? null,
          status: field.status,
          extractedAt: now,
          reviewedAt:
            field.status === "confirmed" || field.status === "rejected"
              ? now
              : null,
          createdAt: now,
          updatedAt: now,
        })),
      );
    }

    return this.findOne(id);
  }

  async replaceAuditEvents(
    id: string,
    events: UpdateDocumentAuditEventDto[],
  ): Promise<DocumentResult> {
    await this.findOne(id);

    await this.databaseService.client
      .delete(documentAuditEvents)
      .where(eq(documentAuditEvents.documentId, id));

    if (events.length > 0) {
      const now = new Date();
      await this.databaseService.client.insert(documentAuditEvents).values(
        events.map((event) => ({
          documentId: id,
          kind: event.kind,
          label: event.label,
          actor: event.actor,
          actorBadge: event.actorBadge,
          role: event.role,
          tone: event.tone,
          eventAt: event.timestamp ? new Date(event.timestamp) : null,
          createdAt: now,
          updatedAt: now,
        })),
      );
    }

    return this.findOne(id);
  }

  async remove(id: string): Promise<DeleteDocumentResult> {
    const [deleted] = await this.databaseService.client
      .delete(documents)
      .where(eq(documents.id, id))
      .returning({ id: documents.id });

    if (!deleted) throw new NotFoundException("Document was not found");
    return { success: true, data: deleted };
  }

  private baseSelect() {
    return this.databaseService.client
      .select({
        document: documents,
        driverDocumentFileUrl: driverDocuments.fileUrl,
        driverDocumentMimeType: driverDocuments.mimeType,
        uploadedBy: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        },
        driver: {
          id: drivers.id,
          firstName: drivers.firstName,
          lastName: drivers.lastName,
        },
        load: {
          id: loads.id,
          referenceNumber: loads.referenceNumber,
        },
      })
      .from(documents)
      .leftJoin(driverDocuments, eq(documents.id, driverDocuments.id))
      .leftJoin(users, eq(documents.uploadedByUserId, users.id))
      .leftJoin(drivers, eq(documents.driverId, drivers.id))
      .leftJoin(loads, eq(documents.loadId, loads.id));
  }

  private buildFilters(query: ListDocumentsQueryDto): SQL[] {
    const filters: SQL[] = [];
    if (query.search) {
      const pattern = `%${query.search}%`;
      const normalizedSearch = query.search.toLowerCase();
      const matchingTypes = documentTypeLabels
        .filter(([label]) => label.includes(normalizedSearch))
        .map(([, type]) => type);
      const search = or(
        ilike(documents.fileName, pattern),
        ilike(loads.referenceNumber, pattern),
        ilike(drivers.firstName, pattern),
        ilike(drivers.lastName, pattern),
        matchingTypes.length > 0
          ? inArray(documents.type, matchingTypes)
          : undefined,
      );
      if (search) filters.push(search);
    }
    if (query.driverId) filters.push(eq(documents.driverId, query.driverId));
    if (query.loadId) filters.push(eq(documents.loadId, query.loadId));
    if (query.type) filters.push(eq(documents.type, query.type));
    if (query.status) filters.push(eq(documents.status, query.status));
    return filters;
  }

  private sortColumn(sortBy: ListDocumentsQueryDto["sortBy"]): AnyColumn {
    return {
      uploadedAt: documents.uploadedAt,
      fileName: documents.fileName,
      type: documents.type,
      status: documents.status,
      updatedAt: documents.updatedAt,
    }[sortBy];
  }

  private toDocument(
    document: DocumentRecord,
    driver: DriverSummary,
    load: LoadSummary,
    fileUrl: string | null = null,
    mimeType: string | null = null,
    uploadedBy: DocumentItem["uploadedBy"] = null,
    extractedFields: DocumentExtractedFieldItem[] = [],
    auditEvents: DocumentAuditEventItem[] = [],
  ): DocumentItem {
    return {
      id: document.id,
      fileName: document.fileName,
      fileSize: document.fileSize,
      fileUrl,
      mimeType,
      pageCount: document.pageCount,
      extractionModel: document.extractionModel,
      processingTimeMs: document.processingTimeMs,
      type: document.type,
      status: document.status,
      uploadedBy: uploadedBy?.id ? uploadedBy : null,
      driver: driver?.id ? driver : null,
      load: load?.id ? load : null,
      extractedFields,
      auditEvents,
      uploadedAt: document.uploadedAt.toISOString(),
      createdAt: document.createdAt.toISOString(),
      updatedAt: document.updatedAt.toISOString(),
    };
  }

  private toDocumentExtractedField(
    field: typeof documentExtractedFields.$inferSelect,
  ): DocumentExtractedFieldItem {
    return {
      ...field,
      extractedAt: field.extractedAt.toISOString(),
      reviewedAt: field.reviewedAt?.toISOString() ?? null,
      createdAt: field.createdAt.toISOString(),
      updatedAt: field.updatedAt.toISOString(),
    };
  }

  private toDocumentAuditEvent(
    event: typeof documentAuditEvents.$inferSelect,
  ): DocumentAuditEventItem {
    return {
      id: event.id,
      kind: event.kind,
      label: event.label,
      actor: event.actor,
      actorBadge: event.actorBadge,
      role: event.role,
      tone: event.tone,
      timestamp: event.eventAt?.toISOString() ?? null,
      createdAt: event.createdAt.toISOString(),
      updatedAt: event.updatedAt.toISOString(),
    };
  }

  private async assertRelationExists(
    table: typeof drivers | typeof loads,
    id: string,
    label: "Driver" | "Load",
  ): Promise<void> {
    const [record] = await this.databaseService.client
      .select({ id: table.id })
      .from(table)
      .where(eq(table.id, id))
      .limit(1);

    if (!record) throw new NotFoundException(`${label} was not found`);
  }
}
