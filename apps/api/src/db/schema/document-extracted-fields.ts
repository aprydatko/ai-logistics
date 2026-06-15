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

import { documents } from "./documents";
import { users } from "./users";

export const documentExtractedFieldStatusEnum = pgEnum(
  "document_extracted_field_status",
  ["extracted", "edited", "confirmed", "rejected", "missing"],
);

export const documentExtractedFieldEventTypeEnum = pgEnum(
  "document_extracted_field_event_type",
  ["extracted", "edited", "confirmed", "rejected", "reset"],
);

export const documentExtractedFields = pgTable(
  "document_extracted_fields",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    fieldKey: varchar("field_key", { length: 100 }).notNull(),
    label: varchar("label", { length: 160 }).notNull(),
    rawValue: text("raw_value"),
    normalizedValue: text("normalized_value"),
    confidence: integer("confidence"),
    status: documentExtractedFieldStatusEnum("status")
      .default("extracted")
      .notNull(),
    extractedAt: timestamp("extracted_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    extractedByUserId: uuid("extracted_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewedByUserId: uuid("reviewed_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("document_extracted_fields_document_id_idx").on(table.documentId),
    index("document_extracted_fields_field_key_idx").on(table.fieldKey),
    index("document_extracted_fields_status_idx").on(table.status),
    index("document_extracted_fields_reviewed_by_user_id_idx").on(
      table.reviewedByUserId,
    ),
  ],
);

export const documentExtractedFieldEvents = pgTable(
  "document_extracted_field_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fieldId: uuid("field_id")
      .notNull()
      .references(() => documentExtractedFields.id, { onDelete: "cascade" }),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    eventType: documentExtractedFieldEventTypeEnum("event_type").notNull(),
    actorUserId: uuid("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    previousValue: text("previous_value"),
    nextValue: text("next_value"),
    previousStatus: documentExtractedFieldStatusEnum("previous_status"),
    nextStatus: documentExtractedFieldStatusEnum("next_status"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("document_extracted_field_events_field_id_idx").on(table.fieldId),
    index("document_extracted_field_events_document_id_idx").on(
      table.documentId,
    ),
    index("document_extracted_field_events_event_type_idx").on(table.eventType),
    index("document_extracted_field_events_actor_user_id_idx").on(
      table.actorUserId,
    ),
    index("document_extracted_field_events_created_at_idx").on(table.createdAt),
  ],
);

export type DocumentExtractedFieldRecord =
  typeof documentExtractedFields.$inferSelect;
export type NewDocumentExtractedFieldRecord =
  typeof documentExtractedFields.$inferInsert;

export type DocumentExtractedFieldEventRecord =
  typeof documentExtractedFieldEvents.$inferSelect;
export type NewDocumentExtractedFieldEventRecord =
  typeof documentExtractedFieldEvents.$inferInsert;
