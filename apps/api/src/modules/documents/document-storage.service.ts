import { Injectable } from "@nestjs/common";
import { mkdir, writeFile } from "fs/promises";
import { extname, join } from "path";
import { randomUUID } from "crypto";

type SavedDocumentFile = {
  fileUrl: string;
  storagePath: string;
};

@Injectable()
export class DocumentStorageService {
  private readonly uploadsRoot = join(__dirname, "..", "..", "..", "uploads");
  private readonly documentsRoot = join(this.uploadsRoot, "documents");

  /**
   * Saves an uploaded file to the filesystem with organized directory structure.
   *
   * This method creates a date-based directory structure for efficient file organization,
   * generates a unique filename using UUID, and saves the file buffer to disk. It returns
   * both the relative URL path for API responses and the absolute filesystem path for
   * internal operations.
   *
   * @param file - The uploaded file from multer
   * @returns Object containing fileUrl for API responses and storagePath for filesystem operations
   *
   * @example
   * ```ts
   * const saved = await documentStorageService.save(uploadedFile);
   * console.log(saved.fileUrl); // "/uploads/documents/2024-01-15/abc-123.pdf"
   * console.log(saved.storagePath); // "/var/www/uploads/documents/2024-01-15/abc-123.pdf"
   * ```
   */
  async save(file: Express.Multer.File): Promise<SavedDocumentFile> {
    const extension =
      extname(file.originalname) || this.extensionFromMime(file.mimetype);
    const dateSegment = new Date().toISOString().slice(0, 10);
    const fileName = `${randomUUID()}${extension}`;
    const relativePath = join("documents", dateSegment, fileName);
    const absolutePath = join(this.uploadsRoot, relativePath);

    await mkdir(join(this.documentsRoot, dateSegment), { recursive: true });
    await writeFile(absolutePath, file.buffer);

    return {
      fileUrl: `/uploads/${relativePath.replaceAll("\\", "/")}`,
      storagePath: absolutePath,
    };
  }

  private extensionFromMime(mimeType: string): string {
    return (
      {
        "application/pdf": ".pdf",
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
      }[mimeType] ?? ""
    );
  }
}
