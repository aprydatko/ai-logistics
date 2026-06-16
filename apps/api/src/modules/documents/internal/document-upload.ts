import { BadRequestException } from "@nestjs/common";

import type { DatabaseService } from "../../../db/database.service";
import {
  documentAuditEvents,
  documentExtractedFields,
} from "../../../db/schema";
import type { DocumentVisionService } from "../document-vision.service";
import {
  ALLOWED_UPLOAD_MIME_TYPES,
  MAX_UPLOAD_FILE_SIZE_BYTES,
} from "./document.constants";

/**
 * Type guard that asserts a file is present and throws if not.
 *
 * This function validates that a file was uploaded and throws a BadRequestException
 * if the file is undefined. It's used as a type guard to narrow the type from
 * Express.Multer.File | undefined to Express.Multer.File.
 *
 * @param file - The uploaded file (may be undefined)
 * @throws BadRequestException if file is not present
 *
 * @example
 * ```ts
 * assertUploadFilePresent(file);
 * // file is now guaranteed to be Express.Multer.File
 * ```
 */
export function assertUploadFilePresent(
  file: Express.Multer.File | undefined,
): asserts file is Express.Multer.File {
  if (!file) {
    throw new BadRequestException("File is required");
  }
}

/**
 * Validates an uploaded file against allowed MIME types and size limits.
 *
 * This function checks that the file's MIME type is in the allowed list
 * (PDF, JPEG, PNG, WEBP) and that the file size does not exceed the maximum
 * allowed size (5 MB). Throws BadRequestException for validation failures.
 *
 * @param file - The uploaded file to validate
 * @throws BadRequestException if MIME type or size validation fails
 */
export function validateUploadFile(file: Express.Multer.File): void {
  if (
    !ALLOWED_UPLOAD_MIME_TYPES.includes(
      file.mimetype as (typeof ALLOWED_UPLOAD_MIME_TYPES)[number],
    )
  ) {
    throw new BadRequestException(
      "Only PDF, JPEG, PNG, and WEBP documents are supported",
    );
  }
  if (file.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
    throw new BadRequestException("Document must be 5 MB or smaller");
  }
}

type VisionAnalysis = Awaited<ReturnType<DocumentVisionService["analyze"]>>;

/**
 * Persists side effects of document upload to the database.
 *
 * This function creates audit events and extracted fields records after a successful
 * document upload. It always creates an "uploaded" audit event, and if AI analysis
 * was performed, it also persists the extracted fields and an "ai_extraction" audit event.
 *
 * @param client - Database client for executing queries
 * @param documentId - ID of the uploaded document
 * @param analysis - AI vision analysis results, or null if analysis was skipped/failed
 */
export async function persistUploadSideEffects(
  client: DatabaseService["client"],
  documentId: string,
  analysis: VisionAnalysis | null,
): Promise<void> {
  const now = new Date();

  await client.transaction(async (tx) => {
    await tx.insert(documentAuditEvents).values({
      documentId,
      kind: "uploaded",
      label: "Document uploaded",
      actor: "System",
      actorBadge: "AI",
      role: "Platform",
      tone: "navy",
      eventAt: now,
      createdAt: now,
      updatedAt: now,
    });

    if (!analysis?.extractedFields.length) return;

    await tx.insert(documentExtractedFields).values(
      analysis.extractedFields.map((field) => ({
        documentId,
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

    await tx.insert(documentAuditEvents).values({
      documentId,
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
  });
}

/**
 * Determines the appropriate document status after upload based on AI analysis.
 *
 * This function returns "needs_review" if AI analysis extracted any fields (requiring
 * human verification), or "complete" if no analysis was performed or no fields were
 * extracted. This status determines the workflow for the uploaded document.
 *
 * @param analysis - AI vision analysis results, or null if analysis was skipped/failed
 * @returns "needs_review" if fields were extracted, "complete" otherwise
 */
export function resolveUploadStatus(
  analysis: VisionAnalysis | null,
): "needs_review" | "complete" {
  return analysis?.extractedFields.length ? "needs_review" : "complete";
}
