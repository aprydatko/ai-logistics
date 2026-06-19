import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  StreamableFile,
} from "@nestjs/common";
import type { Queue } from "bullmq";
import { and, asc, count, desc, eq, lt, or } from "drizzle-orm";

import { DatabaseService } from "../../db/database.service";
import {
  documentAuditEvents,
  documents,
  documentExtractedFields,
  documentUploads,
  drivers,
  loads,
  users,
} from "../../db/schema";
import { NotificationsGateway } from "../notifications/notifications.gateway";
import { NotificationsService } from "../notifications/notifications.service";
import { CacheService } from "../cache/cache.service";
import { buildCacheKey } from "../cache/cache.utils";
import {
  type StoredDocumentFile,
  DocumentStorageService,
} from "./document-storage.service";
import { DocumentVisionService } from "./document-vision.service";
import type { CompleteDocumentUploadDto } from "./dto/complete-document-upload.dto";
import type { InitiateDocumentUploadDto } from "./dto/initiate-document-upload.dto";
import type { ListDocumentsQueryDto } from "./dto/list-documents-query.dto";
import type { CreateDocumentDto } from "./dto/create-document.dto";
import type { UpdateDocumentAuditEventDto } from "./dto/update-document-audit-event.dto";
import type { UpdateDocumentDto } from "./dto/update-document.dto";
import type { UpdateDocumentExtractedFieldDto } from "./dto/update-document-extracted-field.dto";
import type { UploadDocumentDto } from "./dto/upload-document.dto";
import type {
  DeleteDocumentResult,
  DocumentFileAccessResult,
  DocumentResult,
  DocumentsListResult,
  DocumentUploadSessionResult,
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
  validateUploadDescriptor,
  validateUploadFile,
} from "./internal/document-upload";
import { DOCUMENT_PROCESSING_QUEUE_TOKEN } from "../queue/queue.constants";
import type { DocumentProcessingJobData } from "../queue/queue.types";

@Injectable()
export class DocumentsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly cacheService: CacheService,
    private readonly documentStorageService: DocumentStorageService,
    private readonly documentVisionService: DocumentVisionService,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly notificationsService: NotificationsService,
    @Inject(DOCUMENT_PROCESSING_QUEUE_TOKEN)
    private readonly documentProcessingQueue: Queue<DocumentProcessingJobData>,
  ) {}

  async findAll(query: ListDocumentsQueryDto): Promise<DocumentsListResult> {
    return this.cacheService.getOrSet(
      "documents",
      buildCacheKey("documents", "find-all", query),
      this.cacheService.getTtl("list"),
      async () => {
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
      },
    );
  }

  async findOne(id: string): Promise<DocumentResult> {
    return this.cacheService.getOrSet(
      "documents",
      buildCacheKey("documents", "find-one", { id }),
      this.cacheService.getTtl("detail"),
      async () => {
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
      },
    );
  }

  async create(
    dto: CreateDocumentDto,
    uploadedByUserId: string,
  ): Promise<DocumentResult> {
    const client = this.databaseService.client;
    await this.assertRelations(dto.driverId, dto.loadId);

    const [created] = await client
      .insert(documents)
      .values({
        fileName: dto.fileName,
        fileSize: dto.fileSize,
        mimeType: dto.mimeType,
        fileUrl: null,
        storagePath: null,
        storageProvider: "local",
        storageBucket: null,
        objectKey: null,
        etag: null,
        type: dto.type,
        status: dto.status,
        uploadedByUserId,
        driverId: dto.driverId,
        loadId: dto.loadId,
        uploadedAt: new Date(),
      })
      .returning({ id: documents.id });

    if (!created) throw new BadRequestException("Unable to create document");
    await this.invalidateDocumentReadCaches();
    return this.findOne(created.id);
  }

  async update(id: string, dto: UpdateDocumentDto): Promise<DocumentResult> {
    if (!Object.values(dto).some((value) => value !== undefined)) {
      throw new BadRequestException("At least one field must be provided");
    }

    await this.assertRelations(dto.driverId, dto.loadId);

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
    await this.invalidateDocumentReadCaches();
    return this.findOne(id);
  }

  async upload(
    file: Express.Multer.File | undefined,
    dto: UploadDocumentDto,
    uploadedByUserId: string,
  ): Promise<DocumentResult> {
    assertUploadFilePresent(file);
    validateUploadFile(file);
    await this.assertRelations(dto.driverId, dto.loadId);

    const savedFile = await this.documentStorageService.save(file);
    const analysisStartedAt = Date.now();
    const shouldQueueAnalysis =
      dto.analyzeWithVision !== false && this.documentVisionService.isEnabled;
    const analysis =
      shouldQueueAnalysis || dto.analyzeWithVision === false
        ? null
        : await this.documentVisionService.analyze({
            buffer: file.buffer,
            mimeType: file.mimetype,
            fileName: file.originalname,
          });

    return this.createDocumentFromStoredFile(
      {
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        type: dto.type,
        driverId: dto.driverId,
        loadId: dto.loadId,
        analyzeWithVision: dto.analyzeWithVision !== false,
      },
      uploadedByUserId,
      savedFile,
      {
        queueAnalysis: shouldQueueAnalysis,
        analysis,
        processingTimeMs: analysis ? Date.now() - analysisStartedAt : null,
      },
    );
  }

  async initiateUpload(
    dto: InitiateDocumentUploadDto,
    uploadedByUserId: string,
  ): Promise<DocumentUploadSessionResult> {
    validateUploadDescriptor({
      mimeType: dto.mimeType,
      fileSize: dto.fileSize,
    });
    await this.assertRelations(dto.driverId, dto.loadId);

    if (this.documentStorageService.defaultProvider !== "s3") {
      throw new BadRequestException(
        "Direct uploads require S3-compatible storage to be configured",
      );
    }

    const objectKey = this.documentStorageService.buildObjectKey(
      dto.fileName,
      dto.mimeType,
    );
    const { uploadUrl, expiresAt } =
      await this.documentStorageService.createPresignedUploadUrl({
        objectKey,
        mimeType: dto.mimeType,
      });

    const [created] = await this.databaseService.client
      .insert(documentUploads)
      .values({
        storageProvider: "s3",
        bucket: this.documentStorageService.defaultBucket,
        objectKey,
        originalFileName: dto.fileName,
        mimeType: dto.mimeType,
        fileSize: dto.fileSize,
        type: dto.type,
        driverId: dto.driverId,
        loadId: dto.loadId,
        uploadedByUserId,
        analyzeWithVision: dto.analyzeWithVision !== false,
        status: "pending",
        expiresAt,
      })
      .returning();

    if (!created) {
      throw new BadRequestException("Unable to create document upload session");
    }

    return {
      success: true,
      data: {
        id: created.id,
        status: created.status,
        uploadUrl,
        objectKey: created.objectKey,
        expiresAt: created.expiresAt.toISOString(),
      },
    };
  }

  async completeUpload(
    uploadId: string,
    _dto: CompleteDocumentUploadDto,
    uploadedByUserId: string,
  ): Promise<DocumentResult> {
    await this.expireStaleUploads();

    const [upload] = await this.databaseService.client
      .select()
      .from(documentUploads)
      .where(eq(documentUploads.id, uploadId))
      .limit(1);

    if (!upload || upload.uploadedByUserId !== uploadedByUserId) {
      throw new NotFoundException("Document upload session was not found");
    }
    if (upload.status === "completed") {
      throw new BadRequestException(
        "Document upload session already completed",
      );
    }
    if (
      upload.status === "expired" ||
      upload.expiresAt.getTime() <= Date.now()
    ) {
      throw new BadRequestException("Document upload session has expired");
    }

    const objectMetadata = await this.documentStorageService.stat({
      storageProvider: upload.storageProvider,
      storagePath: null,
      storageBucket: upload.bucket,
      objectKey: upload.objectKey,
    });

    const document = await this.createDocumentFromStoredFile(
      {
        fileName: upload.originalFileName,
        fileSize: objectMetadata.size,
        mimeType: upload.mimeType,
        type: upload.type,
        driverId: upload.driverId ?? undefined,
        loadId: upload.loadId ?? undefined,
        analyzeWithVision: upload.analyzeWithVision,
      },
      uploadedByUserId,
      {
        fileUrl: null,
        storagePath: null,
        storageProvider: upload.storageProvider,
        storageBucket: upload.bucket,
        objectKey: upload.objectKey,
        etag: objectMetadata.etag,
      },
      {
        queueAnalysis:
          upload.analyzeWithVision && this.documentVisionService.isEnabled,
        analysis: null,
        processingTimeMs: null,
      },
    );

    await this.databaseService.client
      .update(documentUploads)
      .set({
        status: "completed",
        etag: objectMetadata.etag,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(documentUploads.id, upload.id));

    return document;
  }

  async getFileAccess(documentId: string): Promise<DocumentFileAccessResult> {
    const [document] = await this.databaseService.client
      .select({
        id: documents.id,
        fileName: documents.fileName,
        fileUrl: documents.fileUrl,
        storageProvider: documents.storageProvider,
        storageBucket: documents.storageBucket,
        objectKey: documents.objectKey,
      })
      .from(documents)
      .where(eq(documents.id, documentId))
      .limit(1);

    if (!document) {
      throw new NotFoundException("Document was not found");
    }

    if (document.storageProvider === "s3") {
      if (!document.storageBucket || !document.objectKey) {
        throw new BadRequestException("Document storage reference is missing");
      }

      try {
        const access =
          await this.documentStorageService.createPresignedDownloadUrl({
            bucket: document.storageBucket,
            objectKey: document.objectKey,
            fileName: document.fileName,
          });

        return {
          success: true,
          data: {
            url: access.url,
            expiresAt: access.expiresAt.toISOString(),
          },
        };
      } catch {
        return {
          success: true,
          data: {
            url: `/api/documents/${document.id}/file`,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          },
        };
      }
    }

    if (!document.fileUrl) {
      throw new BadRequestException("Document file URL is missing");
    }

    return {
      success: true,
      data: {
        url: `/api/documents/${document.id}/file`,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      },
    };
  }

  async getFileStream(documentId: string): Promise<{
    file: StreamableFile;
    fileName: string;
    mimeType: string;
  }> {
    const [document] = await this.databaseService.client
      .select({
        id: documents.id,
        fileName: documents.fileName,
        mimeType: documents.mimeType,
        storagePath: documents.storagePath,
        storageProvider: documents.storageProvider,
        storageBucket: documents.storageBucket,
        objectKey: documents.objectKey,
      })
      .from(documents)
      .where(eq(documents.id, documentId))
      .limit(1);

    if (!document || !document.mimeType) {
      throw new NotFoundException("Document was not found");
    }

    const buffer = await this.documentStorageService.read({
      storageProvider: document.storageProvider,
      storagePath: document.storagePath,
      storageBucket: document.storageBucket,
      objectKey: document.objectKey,
    });

    return {
      file: new StreamableFile(buffer),
      fileName: document.fileName,
      mimeType: document.mimeType,
    };
  }

  async processQueuedAnalysis(documentId: string): Promise<void> {
    const [document] = await this.databaseService.client
      .select({
        id: documents.id,
        fileName: documents.fileName,
        fileSize: documents.fileSize,
        mimeType: documents.mimeType,
        storagePath: documents.storagePath,
        storageProvider: documents.storageProvider,
        storageBucket: documents.storageBucket,
        objectKey: documents.objectKey,
      })
      .from(documents)
      .where(eq(documents.id, documentId))
      .limit(1);

    if (!document?.mimeType) return;

    const startedAt = Date.now();
    const buffer = await this.documentStorageService.read({
      storageProvider: document.storageProvider,
      storagePath: document.storagePath,
      storageBucket: document.storageBucket,
      objectKey: document.objectKey,
    });
    const analysis = await this.documentVisionService.analyze({
      buffer,
      mimeType: document.mimeType,
      fileName: document.fileName,
    });

    await this.databaseService.client
      .update(documents)
      .set({
        extractionModel: analysis?.extractionModel ?? null,
        processingTimeMs: Date.now() - startedAt,
        status: resolveUploadStatus(analysis),
        updatedAt: new Date(),
      })
      .where(eq(documents.id, documentId));

    if (analysis?.extractedFields.length) {
      await persistVisionAnalysis(
        this.databaseService.client,
        documentId,
        analysis,
      );
    }

    await this.invalidateDocumentReadCaches();
    await this.emitDocumentProcessingUpdated(documentId);
  }

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

    await this.invalidateDocumentReadCaches();
    return this.findOne(id);
  }

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

    await this.invalidateDocumentReadCaches();
    return this.findOne(id);
  }

  async remove(id: string): Promise<DeleteDocumentResult> {
    const [deleted] = await this.databaseService.client
      .delete(documents)
      .where(eq(documents.id, id))
      .returning({ id: documents.id });

    if (!deleted) throw new NotFoundException("Document was not found");
    await this.invalidateDocumentReadCaches();
    return { success: true, data: deleted };
  }

  private async createDocumentFromStoredFile(
    input: {
      fileName: string;
      fileSize: number;
      mimeType: string;
      type: UploadDocumentDto["type"];
      driverId?: string;
      loadId?: string;
      analyzeWithVision: boolean;
    },
    uploadedByUserId: string,
    storedFile: StoredDocumentFile,
    options: {
      queueAnalysis: boolean;
      analysis: Awaited<ReturnType<DocumentVisionService["analyze"]>>;
      processingTimeMs: number | null;
    },
  ): Promise<DocumentResult> {
    const [created] = await this.databaseService.client
      .insert(documents)
      .values({
        fileName: input.fileName,
        fileSize: input.fileSize,
        mimeType: input.mimeType,
        fileUrl: storedFile.fileUrl,
        storagePath: storedFile.storagePath,
        storageProvider: storedFile.storageProvider,
        storageBucket: storedFile.storageBucket,
        objectKey: storedFile.objectKey,
        etag: storedFile.etag,
        type: input.type,
        status: options.queueAnalysis
          ? "processing"
          : resolveUploadStatus(options.analysis),
        uploadedByUserId,
        driverId: input.driverId,
        loadId: input.loadId,
        extractionModel: options.analysis?.extractionModel ?? null,
        processingTimeMs: options.processingTimeMs,
        uploadedAt: new Date(),
      })
      .returning({ id: documents.id });

    if (!created) throw new BadRequestException("Unable to upload document");

    await persistUploadAuditEvent(this.databaseService.client, created.id);
    if (options.analysis?.extractedFields.length) {
      await persistVisionAnalysis(
        this.databaseService.client,
        created.id,
        options.analysis,
      );
    }
    if (options.queueAnalysis) {
      await this.documentProcessingQueue.add(
        "analyze-document",
        { documentId: created.id },
        {
          attempts: 3,
          backoff: { type: "exponential", delay: 2_000 },
          removeOnComplete: 100,
          removeOnFail: 100,
        },
      );
    }

    await this.invalidateDocumentReadCaches();
    return this.findOne(created.id);
  }

  private async assertRelations(
    driverId?: string | null,
    loadId?: string | null,
  ): Promise<void> {
    const client = this.databaseService.client;
    if (driverId) {
      await assertDocumentRelationExists(client, drivers, driverId, "Driver");
    }
    if (loadId) {
      await assertDocumentRelationExists(client, loads, loadId, "Load");
    }
  }

  private async expireStaleUploads(): Promise<void> {
    await this.databaseService.client
      .update(documentUploads)
      .set({
        status: "expired",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(documentUploads.status, "pending"),
          lt(documentUploads.expiresAt, new Date()),
        ),
      );
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

  private async invalidateDocumentReadCaches(): Promise<void> {
    await Promise.all([
      this.cacheService.invalidateNamespace("documents"),
      this.cacheService.invalidateNamespace("drivers"),
    ]);
  }
}
