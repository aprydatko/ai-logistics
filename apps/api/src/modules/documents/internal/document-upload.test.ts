import { describe, expect, it } from "vitest";

import {
  matchesUploadMimeTypeSignature,
  validateUploadFile,
} from "./document-upload";

const createUploadFile = (
  mimetype: string,
  buffer: Buffer,
): Express.Multer.File =>
  ({
    buffer,
    fieldname: "file",
    filename: "test.bin",
    mimetype,
    originalname: "test.bin",
    size: buffer.length,
  }) as Express.Multer.File;

describe("document-upload", () => {
  it("accepts valid file signatures for allowed MIME types", () => {
    expect(
      matchesUploadMimeTypeSignature(
        "application/pdf",
        Buffer.from("%PDF-1.7 sample"),
      ),
    ).toBe(true);
    expect(
      matchesUploadMimeTypeSignature(
        "image/jpeg",
        Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]),
      ),
    ).toBe(true);
    expect(
      matchesUploadMimeTypeSignature(
        "image/png",
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]),
      ),
    ).toBe(true);
    expect(
      matchesUploadMimeTypeSignature(
        "image/webp",
        Buffer.from("RIFF1234WEBPVP8 ", "ascii"),
      ),
    ).toBe(true);
  });

  it("rejects mismatched file signatures even when MIME type is allowed", () => {
    const file = createUploadFile(
      "application/pdf",
      Buffer.from("<html>not a pdf</html>"),
    );

    expect(() => validateUploadFile(file)).toThrow(
      "Uploaded file content does not match the declared MIME type",
    );
  });
});
