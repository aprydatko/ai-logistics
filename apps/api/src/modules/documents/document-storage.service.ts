import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import { Client } from "minio";
import { dirname, extname, join } from "path";

import type { Environment } from "../../config/environment";

export type StoredDocumentFile = {
  fileUrl: string | null;
  storagePath: string | null;
  storageProvider: "local" | "s3";
  storageBucket: string | null;
  objectKey: string | null;
  etag: string | null;
};

export type StoredObjectLocator = {
  storageProvider: "local" | "s3";
  storagePath: string | null;
  storageBucket: string | null;
  objectKey: string | null;
};

export type StoredObjectMetadata = {
  etag: string | null;
  mimeType: string | null;
  size: number;
};

@Injectable()
export class DocumentStorageService {
  private readonly uploadsRoot = join(__dirname, "..", "..", "..", "uploads");
  private readonly provider: Environment["STORAGE_PROVIDER"];
  private readonly bucket: string;
  private readonly presignTtlSeconds: number;
  private readonly s3PublicBaseUrl: string | null;
  private readonly s3Client: Client | null;

  constructor(configService: ConfigService<Environment, true>) {
    this.provider = configService.get("STORAGE_PROVIDER", { infer: true });
    this.bucket = configService.get("S3_BUCKET", { infer: true });
    this.presignTtlSeconds = configService.get("S3_PRESIGN_TTL_SECONDS", {
      infer: true,
    });
    this.s3PublicBaseUrl =
      configService.get("S3_PUBLIC_BASE_URL", { infer: true }) ?? null;

    const endpoint = configService.get("S3_ENDPOINT", { infer: true });
    const accessKey = configService.get("S3_ACCESS_KEY", { infer: true });
    const secretKey = configService.get("S3_SECRET_KEY", { infer: true });
    const useSSL = configService.get("S3_USE_SSL", { infer: true });

    if (endpoint && accessKey && secretKey) {
      const parsedEndpoint = this.parseEndpoint(endpoint, useSSL);
      this.s3Client = new Client({
        endPoint: parsedEndpoint.endPoint,
        port: parsedEndpoint.port,
        useSSL: parsedEndpoint.useSSL,
        accessKey,
        secretKey,
        region: configService.get("S3_REGION", { infer: true }),
      });
    } else {
      this.s3Client = null;
    }
  }

  get defaultProvider(): "local" | "s3" {
    return this.provider;
  }

  get defaultBucket(): string {
    return this.bucket;
  }

  async save(file: Express.Multer.File): Promise<StoredDocumentFile> {
    const objectKey = this.buildObjectKey(file.originalname, file.mimetype);
    if (this.provider === "s3") {
      const client = this.requireS3Client();
      const result = await client.putObject(
        this.bucket,
        objectKey,
        file.buffer,
        file.size,
        { "Content-Type": file.mimetype },
      );

      return {
        fileUrl: null,
        storagePath: null,
        storageProvider: "s3",
        storageBucket: this.bucket,
        objectKey,
        etag: result.etag,
      };
    }

    const absolutePath = join(
      this.uploadsRoot,
      objectKey.replaceAll("/", "\\"),
    );
    const targetDirectory = dirname(absolutePath);

    await mkdir(targetDirectory, { recursive: true });
    await writeFile(absolutePath, file.buffer);

    return {
      fileUrl: `/uploads/${objectKey}`,
      storagePath: absolutePath,
      storageProvider: "local",
      storageBucket: null,
      objectKey,
      etag: null,
    };
  }

  async read(locator: StoredObjectLocator): Promise<Buffer> {
    if (locator.storageProvider === "s3") {
      const client = this.requireS3Client();
      if (!locator.storageBucket || !locator.objectKey) {
        throw new BadRequestException("Missing object storage reference");
      }

      const stream = await client.getObject(
        locator.storageBucket,
        locator.objectKey,
      );
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      return Buffer.concat(chunks);
    }

    if (!locator.storagePath) {
      throw new BadRequestException("Missing local storage path");
    }

    return readFile(locator.storagePath);
  }

  async stat(locator: StoredObjectLocator): Promise<StoredObjectMetadata> {
    if (locator.storageProvider === "s3") {
      const client = this.requireS3Client();
      if (!locator.storageBucket || !locator.objectKey) {
        throw new BadRequestException("Missing object storage reference");
      }

      const stat = await client.statObject(
        locator.storageBucket,
        locator.objectKey,
      );
      return {
        etag:
          typeof stat.etag === "string" ? stat.etag.replaceAll('"', "") : null,
        mimeType:
          typeof stat.metaData?.["content-type"] === "string"
            ? stat.metaData["content-type"]
            : null,
        size: stat.size,
      };
    }

    if (!locator.storagePath) {
      throw new BadRequestException("Missing local storage path");
    }

    const buffer = await readFile(locator.storagePath);
    return {
      etag: null,
      mimeType: null,
      size: buffer.byteLength,
    };
  }

  async createPresignedUploadUrl(params: {
    objectKey: string;
    mimeType: string;
  }): Promise<{ uploadUrl: string; expiresAt: Date }> {
    const client = this.requireS3Client();
    const uploadUrl = await client.presignedPutObject(
      this.bucket,
      params.objectKey,
      this.presignTtlSeconds,
    );

    return {
      uploadUrl: this.rewritePublicUrl(uploadUrl),
      expiresAt: new Date(Date.now() + this.presignTtlSeconds * 1000),
    };
  }

  async createPresignedDownloadUrl(params: {
    bucket: string;
    objectKey: string;
    fileName?: string;
  }): Promise<{ url: string; expiresAt: Date }> {
    const client = this.requireS3Client();
    const url = await client.presignedGetObject(
      params.bucket,
      params.objectKey,
      this.presignTtlSeconds,
      params.fileName
        ? {
            "response-content-disposition": `inline; filename="${params.fileName}"`,
          }
        : undefined,
    );

    return {
      url: this.rewritePublicUrl(url),
      expiresAt: new Date(Date.now() + this.presignTtlSeconds * 1000),
    };
  }

  buildObjectKey(fileName: string, mimeType?: string): string {
    const dateSegment = new Date().toISOString().slice(0, 10);
    const extension =
      extname(fileName) || (mimeType ? this.extensionFromMime(mimeType) : "");
    return `documents/${dateSegment}/${randomUUID()}${extension}`;
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

  private requireS3Client(): Client {
    if (!this.s3Client) {
      throw new InternalServerErrorException(
        "S3 storage is not configured for document uploads",
      );
    }

    return this.s3Client;
  }

  private rewritePublicUrl(url: string): string {
    if (!this.s3PublicBaseUrl) return url;

    try {
      const parsedUrl = new URL(url);
      const publicBaseUrl = new URL(this.s3PublicBaseUrl);
      parsedUrl.protocol = publicBaseUrl.protocol;
      parsedUrl.host = publicBaseUrl.host;
      return parsedUrl.toString();
    } catch {
      return url;
    }
  }

  private parseEndpoint(
    endpoint: string,
    fallbackUseSsl: boolean,
  ): { endPoint: string; port?: number; useSSL: boolean } {
    const normalizedEndpoint =
      endpoint.startsWith("http://") || endpoint.startsWith("https://")
        ? endpoint
        : `${fallbackUseSsl ? "https" : "http"}://${endpoint}`;

    const url = new URL(normalizedEndpoint);
    const port = url.port ? Number(url.port) : undefined;

    return {
      endPoint: url.hostname,
      port,
      useSSL: url.protocol === "https:",
    };
  }
}
