import type { BaseEntity, ISODateString } from "./common.js";

export type DocumentType =
  | "bill_of_lading"
  | "proof_of_delivery"
  | "rate_confirmation"
  | "driver_license";

export type DocumentStatus = "complete" | "processing" | "needs_review";
export type DocumentExtractedFieldStatus =
  | "extracted"
  | "edited"
  | "confirmed"
  | "rejected"
  | "missing";
export type DocumentAuditEventTone = "green" | "navy" | "violet";
export type DocumentAuditEventKind =
  | "uploaded"
  | "ai_extraction"
  | "load_link"
  | "driver_link"
  | "custom";

export type DocumentDriverSummary = {
  id: string;
  firstName: string;
  lastName: string;
};

export type DocumentLoadSummary = {
  id: string;
  referenceNumber: string;
};

export type DocumentUploaderSummary = {
  id: string;
  firstName: string;
  lastName: string;
};

export type DocumentExtractedField = {
  id: string;
  fieldKey: string;
  label: string;
  rawValue: string | null;
  normalizedValue: string | null;
  confidence: number | null;
  status: DocumentExtractedFieldStatus;
  extractedAt: ISODateString;
  reviewedAt: ISODateString | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
};

export type DocumentAuditEvent = {
  id: string;
  kind: DocumentAuditEventKind;
  label: string;
  actor: string;
  actorBadge: string;
  role: string;
  tone: DocumentAuditEventTone;
  timestamp: ISODateString | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
};

export interface Document extends BaseEntity {
  fileName: string;
  fileSize: number;
  fileUrl: string | null;
  mimeType: string | null;
  pageCount: number | null;
  extractionModel: string | null;
  processingTimeMs: number | null;
  type: DocumentType;
  status: DocumentStatus;
  uploadedBy: DocumentUploaderSummary | null;
  driver: DocumentDriverSummary | null;
  load: DocumentLoadSummary | null;
  extractedFields: DocumentExtractedField[];
  auditEvents: DocumentAuditEvent[];
  uploadedAt: ISODateString;
}
