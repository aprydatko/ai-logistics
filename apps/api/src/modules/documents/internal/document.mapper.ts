import type {
  documentAuditEvents,
  documentExtractedFields,
  DocumentRecord,
} from "../../../db/schema";
import type {
  DocumentAuditEventItem,
  DocumentExtractedFieldItem,
  DocumentItem,
} from "../documents.types";

type DriverSummary = DocumentItem["driver"];
type LoadSummary = DocumentItem["load"];

export function toDocumentItem(
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
    storage: {
      provider: document.storageProvider,
      bucket: document.storageBucket,
      objectKey: document.objectKey,
      etag: document.etag,
    },
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

export function toDocumentExtractedFieldItem(
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

export function toDocumentAuditEventItem(
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
