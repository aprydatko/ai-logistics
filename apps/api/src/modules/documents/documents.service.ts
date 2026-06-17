import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Queue } from "bullmq";
import { and, asc, count, desc, eq, or } from "drizzle-orm";

import { DatabaseService } from "../../db/database.service";
import {
  documentAuditEvents,
  documents,
  documentExtractedFields,
  drivers,
  loads,
  users,
} from "../../db/schema";
import { NotificationsGateway } from "../notifications/notifications.gateway";
import { NotificationsService } from "../notifications/notifications.service";
import { DocumentStorageService } from "./document-storage.service";
import { DocumentVisionService } from "./document-vision.service";
import type { ListDocumentsQueryDto } from "./dto/list-documents-query.dto";
import type { CreateDocumentDto } from "./dto/create-document.dto";
import type { UpdateDocumentAuditEventDto } from "./dto/update-document-audit-event.dto";
import type { UpdateDocumentDto } from "./dto/update-document.dto";
import type { UpdateDocumentExtractedFieldDto } from "./dto/update-document-extracted-field.dto";
import type { UploadDocumentDto } from "./dto/upload-document.dto";
import type {
  DeleteDocumentResult,
  DocumentResult,
  DocumentsListResult,
} from "./documents.types";
import {
  toDocumentAuditEventItem,
  toDocumentExtractedFieldItem,
  toDocumentItem,
} from "./internal/document.mapper";
import {
  buildDocumentFilters,
  documentBaseSelect,
  resolveDocumentSortColumn,
} from "./internal/document.query";
import { assertDocumentRelationExists } from "./internal/document.relations";
import {
  assertUploadFilePresent,
  persistUploadAuditEvent,
  persistVisionAnalysis,
  resolveUploadStatus,
  validateUploadFile,
} from "./internal/document-upload";
import { DOCUMENT_PROCESSING_QUEUE_TOKEN } from "../queue/queue.constants";
import type { DocumentProcessingJobData } from "../queue/queue.types";

@Injectable()
export class DocumentsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly documentStorageService: DocumentStorageService,
    private readonly documentVisionService: DocumentVisionService,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly notificationsService: NotificationsService,
    @Inject(DOCUMENT_PROCESSING_QUEUE_TOKEN)
    private readonly documentProcessingQueue: Queue<DocumentProcessingJobData>,
  ) {}

  /**
   * Retrieves a paginated list of documents with filtering and sorting.
   *
   * This method builds dynamic SQL filters based on query parameters, executes
   * parallel queries for data and total count, and maps database records to
   * the API response format including related driver and load information.
   *
   * @param query - Query parameters for filtering, sorting, and pagination
   * @returns Paginated list of documents with metadata
   *
   * @example
   * ```ts
   * const result = await documentsService.findAll({
   *   page: 1,
   *   limit: 10,
   *   search: "invoice",
   *   sortBy: "uploadedAt",
   *   sortOrder: "desc"
   * });
   * ```
   */
  async findAll(query: ListDocumentsQueryDto): Promise<DocumentsListResult> {
    const filters = buildDocumentFilters(query);
    const where = filters.length > 0 ? and(...filters) : undefined;
    const sortColumn = resolveDocumentSortColumn(query.sortBy);
    const direction = query.sortOrder === "asc" ? asc : desc;
    const client = this.databaseService.client;
    const [rows, totalRows] = await Promise.all([
      documentBaseSelect(client)
        .where(where)
        .orderBy(direction(sortColumn), desc(documents.id))
        .limit(query.limit)
        .offset((query.page - 1) * query.limit),
      client
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
        toDocumentItem(
          row.document,
          row.driver,
          row.load,
          row.document.fileUrl ?? row.driverDocumentFileUrl,
          row.document.mimeType ?? row.driverDocumentMimeType,
          row.uploadedBy,
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

  /**
   * Retrieves a single document by ID with all related data.
   *
   * This method fetches the document record along with its extracted fields
   * and audit events in parallel queries. It validates document existence
   * and maps all related data to the API response format.
   *
   * @param id - The document UUID
   * @returns Document with extracted fields and audit events
   * @throws NotFoundException if document doesn't exist
   */
  async findOne(id: string): Promise<DocumentResult> {
    const client = this.databaseService.client;
    const [[row], extractedFields, auditEvents] = await Promise.all([
      documentBaseSelect(client).where(eq(documents.id, id)).limit(1),
      client
        .select()
        .from(documentExtractedFields)
        .where(eq(documentExtractedFields.documentId, id))
        .orderBy(asc(documentExtractedFields.createdAt)),
      client
        .select()
        .from(documentAuditEvents)
        .where(eq(documentAuditEvents.documentId, id))
        .orderBy(asc(documentAuditEvents.createdAt)),
    ]);

    if (!row) throw new NotFoundException("Document was not found");

    return {
      success: true,
      data: toDocumentItem(
        row.document,
        row.driver,
        row.load,
        row.document.fileUrl ?? row.driverDocumentFileUrl,
        row.document.mimeType ?? row.driverDocumentMimeType,
        row.uploadedBy,
        extractedFields.map(toDocumentExtractedFieldItem),
        auditEvents.map(toDocumentAuditEventItem),
      ),
    };
  }

  /**
   * Creates a new document record without file upload.
   *
   * This method validates driver and load relations if provided, creates a
   * document record in the database, and returns the complete document with
   * all related data. The file URL and storage path are null since no file
   * is uploaded in this operation.
   *
   * @param dto - Document creation data
   * @param uploadedByUserId - ID of the user creating the document
   * @returns Created document with all related data
   * @throws BadRequestException if document creation fails
   * @throws NotFoundException if driver or load doesn't exist
   */
  async create(
    dto: CreateDocumentDto,
    uploadedByUserId: string,
  ): Promise<DocumentResult> {
    const client = this.databaseService.client;
    if (dto.driverId) {
      await assertDocumentRelationExists(
        client,
        drivers,
        dto.driverId,
        "Driver",
      );
    }
    if (dto.loadId) {
      await assertDocumentRelationExists(client, loads, dto.loadId, "Load");
    }

    const [created] = await client
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

  /**
   * Updates an existing document with the provided fields.
   *
   * This method performs a partial update on the document record, validating
   * that at least one field is provided and that driver/load relations exist
   * if they are being updated. Only non-undefined fields are updated.
   *
   * @param id - The document UUID
   * @param dto - Partial document data to update
   * @returns Updated document with all related data
   * @throws BadRequestException if no fields are provided
   * @throws NotFoundException if document doesn't exist
   */
  async update(id: string, dto: UpdateDocumentDto): Promise<DocumentResult> {
    if (!Object.values(dto).some((value) => value !== undefined)) {
      throw new BadRequestException("At least one field must be provided");
    }

    const client = this.databaseService.client;
    if (dto.driverId) {
      await assertDocumentRelationExists(
        client,
        drivers,
        dto.driverId,
        "Driver",
      );
    }
    if (dto.loadId) {
      await assertDocumentRelationExists(client, loads, dto.loadId, "Load");
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
    const [updated] = await client
      .update(documents)
      .set(values)
      .where(eq(documents.id, id))
      .returning({ id: documents.id });

    if (!updated) throw new NotFoundException("Document was not found");
    return this.findOne(id);
  }

  /**
   * Uploads a document file with optional AI vision analysis.
   *
   * This complex method handles the complete document upload workflow:
   * - Validates file presence and format
   * - Validates driver and load relations
   * - Saves file to storage
   * - Optionally performs AI vision analysis
   * - Creates document record with analysis results
   * - Persists extracted fields and audit events as side effects
   *
   * @param file - The uploaded file from multer
   * @param dto - Upload configuration including type and analysis options
   * @param uploadedByUserId - ID of the user uploading the document
   * @returns Created document with all related data
   * @throws BadRequestException if file validation fails or upload fails
   * @throws NotFoundException if driver or load doesn't exist
   */
  async upload(
    file: Express.Multer.File | undefined,
    dto: UploadDocumentDto,
    uploadedByUserId: string,
  ): Promise<DocumentResult> {
    assertUploadFilePresent(file);
    validateUploadFile(file);

    const client = this.databaseService.client;
    if (dto.driverId) {
      await assertDocumentRelationExists(
        client,
        drivers,
        dto.driverId,
        "Driver",
      );
    }
    if (dto.loadId) {
      await assertDocumentRelationExists(client, loads, dto.loadId, "Load");
    }

    const startedAt = Date.now();
    const savedFile = await this.documentStorageService.save(file);
    const shouldQueueAnalysis =
      dto.analyzeWithVision !== false && this.documentVisionService.isEnabled;
    const analysis = shouldQueueAnalysis
      ? null
      : dto.analyzeWithVision !== false
        ? await this.documentVisionService.analyze(file)
        : null;
    const processingTimeMs = analysis ? Date.now() - startedAt : null;

    const [created] = await client
      .insert(documents)
      .values({
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        fileUrl: savedFile.fileUrl,
        storagePath: savedFile.storagePath,
        type: dto.type,
        status: shouldQueueAnalysis
          ? "processing"
          : resolveUploadStatus(analysis),
        uploadedByUserId,
        driverId: dto.driverId,
        loadId: dto.loadId,
        extractionModel: analysis?.extractionModel ?? null,
        processingTimeMs,
        uploadedAt: new Date(),
      })
      .returning({ id: documents.id });

    if (!created) throw new BadRequestException("Unable to upload document");

    await persistUploadAuditEvent(client, created.id);
    if (analysis?.extractedFields.length) {
      await persistVisionAnalysis(client, created.id, analysis);
    }
    if (shouldQueueAnalysis) {
      await this.documentProcessingQueue.add(
        "analyze-document",
        { documentId: created.id },
        {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 2_000,
          },
          removeOnComplete: 100,
          removeOnFail: 100,
        },
      );
    }

    return this.findOne(created.id);
  }

  async processQueuedAnalysis(documentId: string): Promise<void> {
    const client = this.databaseService.client;
    const [document] = await client
      .select({
        id: documents.id,
        fileName: documents.fileName,
        fileSize: documents.fileSize,
        mimeType: documents.mimeType,
        storagePath: documents.storagePath,
      })
      .from(documents)
      .where(eq(documents.id, documentId))
      .limit(1);

    if (!document?.storagePath || !document.mimeType) return;

    const startedAt = Date.now();
    const buffer = await this.documentStorageService.read(document.storagePath);
    const analysis = await this.documentVisionService.analyze({
      buffer,
      destination: "",
      encoding: "7bit",
      fieldname: "file",
      filename: "",
      mimetype: document.mimeType,
      originalname: document.fileName,
      path: document.storagePath,
      size: document.fileSize,
      stream: undefined as never,
    });

    await client
      .update(documents)
      .set({
        extractionModel: analysis?.extractionModel ?? null,
        processingTimeMs: Date.now() - startedAt,
        status: resolveUploadStatus(analysis),
        updatedAt: new Date(),
      })
      .where(eq(documents.id, documentId));

    if (analysis?.extractedFields.length) {
      await persistVisionAnalysis(client, documentId, analysis);
    }

    await this.emitDocumentProcessingUpdated(documentId);
  }

  private async emitDocumentProcessingUpdated(
    documentId: string,
  ): Promise<void> {
    const document = await this.findOne(documentId);
    const recipients = await this.findDocumentStatusRecipients();

    for (const recipient of recipients) {
      this.notificationsGateway.emitDocumentProcessingUpdated(
        recipient.id,
        document.data,
      );
    }

    await this.notificationsService.createDocumentProcessingNotifications({
      documentId: document.data.id,
      fileName: document.data.fileName,
      status: document.data.status,
      uploadedByUserId: document.data.uploadedBy?.id ?? null,
    });
  }

  private async findDocumentStatusRecipients(): Promise<Array<{ id: string }>> {
    return this.databaseService.client
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.isActive, true),
          or(eq(users.role, "admin"), eq(users.role, "dispatcher")),
        ),
      );
  }

  /**
   * Replaces all extracted fields for a document with new values.
   *
   * This method performs a complete replacement operation: it deletes all existing
   * extracted fields for the document and inserts the new set. This ensures atomic
   * updates and maintains data consistency. The method validates document existence
   * before performing the operation.
   *
   * @param id - The document UUID
   * @param fields - Array of extracted field data to replace existing fields
   * @returns Updated document with new extracted fields
   * @throws NotFoundException if document doesn't exist
   */
  async replaceExtractedFields(
    id: string,
    fields: UpdateDocumentExtractedFieldDto[],
  ): Promise<DocumentResult> {
    const client = this.databaseService.client;
    const [exists] = await client
      .select({ id: documents.id })
      .from(documents)
      .where(eq(documents.id, id))
      .limit(1);

    if (!exists) {
      throw new NotFoundException("Document was not found");
    }

    await client.transaction(async (tx) => {
      await tx
        .delete(documentExtractedFields)
        .where(eq(documentExtractedFields.documentId, id));

      if (fields.length > 0) {
        const now = new Date();
        await tx.insert(documentExtractedFields).values(
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
    });

    return this.findOne(id);
  }

  /**
   * Replaces all audit events for a document with new values.
   *
   * This method performs a complete replacement operation: it deletes all existing
   * audit events for the document and inserts the new set. This ensures atomic
   * updates and maintains data consistency. The method validates document existence
   * before performing the operation.
   *
   * @param id - The document UUID
   * @param events - Array of audit event data to replace existing events
   * @returns Updated document with new audit events
   * @throws NotFoundException if document doesn't exist
   */
  async replaceAuditEvents(
    id: string,
    events: UpdateDocumentAuditEventDto[],
  ): Promise<DocumentResult> {
    const client = this.databaseService.client;
    const [exists] = await client
      .select({ id: documents.id })
      .from(documents)
      .where(eq(documents.id, id))
      .limit(1);

    if (!exists) {
      throw new NotFoundException("Document was not found");
    }

    await client.transaction(async (tx) => {
      await tx
        .delete(documentAuditEvents)
        .where(eq(documentAuditEvents.documentId, id));

      if (events.length > 0) {
        const now = new Date();
        await tx.insert(documentAuditEvents).values(
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
    });

    return this.findOne(id);
  }

  /**
   * Deletes a document by ID.
   *
   * This method permanently removes a document record from the database.
   * Note that this does not delete the physical file from storage - that
   * should be handled separately if needed.
   *
   * @param id - The document UUID
   * @returns Deletion confirmation with deleted document ID
   * @throws NotFoundException if document doesn't exist
   */
  async remove(id: string): Promise<DeleteDocumentResult> {
    const [deleted] = await this.databaseService.client
      .delete(documents)
      .where(eq(documents.id, id))
      .returning({ id: documents.id });

    if (!deleted) throw new NotFoundException("Document was not found");
    return { success: true, data: deleted };
  }
}
