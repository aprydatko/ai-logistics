import type { DocumentRecord } from "../../../db/schema";

export type DocumentType = DocumentRecord["type"];

export const documentTypeLabels: Array<[string, DocumentType]> = [
  ["bill of lading", "bill_of_lading"],
  ["proof of delivery", "proof_of_delivery"],
  ["rate confirmation", "rate_confirmation"],
  ["driver license", "driver_license"],
];

export const ALLOWED_UPLOAD_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_UPLOAD_FILE_SIZE_BYTES = 5 * 1024 * 1024;
