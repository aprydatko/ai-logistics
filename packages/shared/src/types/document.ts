import type { BaseEntity, ISODateString } from "./common.js";

export type DocumentType =
  | "bill_of_lading"
  | "proof_of_delivery"
  | "rate_confirmation"
  | "driver_license";

export type DocumentStatus = "complete" | "processing" | "needs_review";

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
  uploadedAt: ISODateString;
}
