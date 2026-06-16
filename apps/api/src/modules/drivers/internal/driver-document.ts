import { BadRequestException } from "@nestjs/common";

import { MAX_DRIVER_DOCUMENT_BYTES } from "./driver.constants";

/**
 * Validates the decoded size of a base64-encoded driver document.
 *
 * Decodes the base64 string length to bytes and throws if it exceeds
 * the maximum allowed driver document size (5 MB).
 *
 * @param content - Base64-encoded file content
 * @returns Decoded file size in bytes
 * @throws BadRequestException if the decoded size exceeds the limit
 */
export function assertDriverDocumentSize(content: string): number {
  const fileSize = Buffer.byteLength(content, "base64");

  if (fileSize > MAX_DRIVER_DOCUMENT_BYTES) {
    throw new BadRequestException("Document must be 5 MB or smaller");
  }

  return fileSize;
}
