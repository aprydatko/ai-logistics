import {
  boolean,
  integer,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { documentStorageProviderEnum, documentTypeEnum } from "./documents";
import { drivers } from "./drivers";
import { loads } from "./loads";
import { users } from "./users";

export const documentUploadStatusEnum = pgEnum("document_upload_status", [
  "pending",
  "uploaded",
  "completed",
  "expired",
]);

export const documentUploads = pgTable(
  "document_uploads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storageProvider: documentStorageProviderEnum("storage_provider")
      .default("s3")
      .notNull(),
    bucket: varchar("bucket", { length: 255 }).notNull(),
    objectKey: text("object_key").notNull(),
    originalFileName: varchar("original_file_name", { length: 255 }).notNull(),
    mimeType: varchar("mime_type", { length: 100 }).notNull(),
    fileSize: integer("file_size").notNull(),
    type: documentTypeEnum("type").notNull(),
    driverId: uuid("driver_id").references(() => drivers.id, {
      onDelete: "set null",
    }),
    loadId: uuid("load_id").references(() => loads.id, {
      onDelete: "set null",
    }),
    uploadedByUserId: uuid("uploaded_by_user_id")
      .references(() => users.id, {
        onDelete: "cascade",
      })
      .notNull(),
    analyzeWithVision: boolean("analyze_with_vision").default(true).notNull(),
    status: documentUploadStatusEnum("status").default("pending").notNull(),
    etag: varchar("etag", { length: 255 }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("document_uploads_status_idx").on(table.status),
    index("document_uploads_uploaded_by_user_id_idx").on(table.uploadedByUserId),
    index("document_uploads_object_key_idx").on(table.objectKey),
    index("document_uploads_expires_at_idx").on(table.expiresAt),
  ],
);

export type DocumentUploadRecord = typeof documentUploads.$inferSelect;
export type NewDocumentUploadRecord = typeof documentUploads.$inferInsert;
