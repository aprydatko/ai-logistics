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

  async save(file: Express.Multer.File): Promise<SavedDocumentFile> {
    const extension = extname(file.originalname) || this.extensionFromMime(file.mimetype);
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
