import {
  index,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { documents } from "./documents";

export const documentAuditEventToneEnum = pgEnum("document_audit_event_tone", [
  "green",
  "navy",
  "violet",
]);

export const documentAuditEventKindEnum = pgEnum("document_audit_event_kind", [
  "uploaded",
  "ai_extraction",
  "load_link",
  "driver_link",
  "custom",
]);

export const documentAuditEvents = pgTable(
  "document_audit_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    kind: documentAuditEventKindEnum("kind").default("custom").notNull(),
    label: varchar("label", { length: 255 }).notNull(),
    actor: varchar("actor", { length: 160 }).notNull(),
    actorBadge: varchar("actor_badge", { length: 3 }).notNull(),
    role: varchar("role", { length: 160 }).notNull(),
    tone: documentAuditEventToneEnum("tone").default("navy").notNull(),
    eventAt: timestamp("event_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("document_audit_events_document_id_idx").on(table.documentId),
    index("document_audit_events_kind_idx").on(table.kind),
    index("document_audit_events_tone_idx").on(table.tone),
    index("document_audit_events_event_at_idx").on(table.eventAt),
  ],
);

export type DocumentAuditEventRecord = typeof documentAuditEvents.$inferSelect;
