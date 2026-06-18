import {
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { drivers } from "./drivers";
import { loads } from "./loads";
import { users } from "./users";

export const documentTypeEnum = pgEnum("document_type", [
  "bill_of_lading",
  "proof_of_delivery",
  "rate_confirmation",
  "driver_license",
]);

export const documentStatusEnum = pgEnum("document_status", [
  "complete",
  "processing",
  "needs_review",
]);

export const documentStorageProviderEnum = pgEnum("document_storage_provider", [
  "local",
  "s3",
]);

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fileName: varchar("file_name", { length: 255 }).notNull(),
    fileSize: integer("file_size").notNull(),
    mimeType: varchar("mime_type", { length: 100 }),
    fileUrl: text("file_url"),
    storagePath: text("storage_path"),
    storageProvider: documentStorageProviderEnum("storage_provider")
      .default("local")
      .notNull(),
    storageBucket: varchar("storage_bucket", { length: 255 }),
    objectKey: text("object_key"),
    etag: varchar("etag", { length: 255 }),
    type: documentTypeEnum("type").notNull(),
    status: documentStatusEnum("status").notNull(),
    uploadedByUserId: uuid("uploaded_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    pageCount: integer("page_count"),
    extractionModel: varchar("extraction_model", { length: 100 }),
    processingTimeMs: integer("processing_time_ms"),
    driverId: uuid("driver_id").references(() => drivers.id, {
      onDelete: "set null",
    }),
    loadId: uuid("load_id").references(() => loads.id, {
      onDelete: "set null",
    }),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("documents_driver_id_idx").on(table.driverId),
    index("documents_load_id_idx").on(table.loadId),
    index("documents_type_idx").on(table.type),
    index("documents_status_idx").on(table.status),
    index("documents_uploaded_by_user_id_idx").on(table.uploadedByUserId),
    index("documents_uploaded_at_idx").on(table.uploadedAt),
    index("documents_storage_provider_idx").on(table.storageProvider),
    index("documents_object_key_idx").on(table.objectKey),
  ],
);

export type DocumentRecord = typeof documents.$inferSelect;
export type NewDocumentRecord = typeof documents.$inferInsert;
