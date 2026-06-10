import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { loads } from "./loads";

export const incidentTypeEnum = pgEnum("incident_type", [
  "flat_tire",
  "delay",
  "accident",
  "fuel_issue",
  "maintenance",
  "other",
]);

export const incidentPriorityEnum = pgEnum("incident_priority", [
  "low",
  "medium",
  "high",
  "critical",
]);

export const incidentStatusEnum = pgEnum("incident_status", [
  "open",
  "investigating",
  "monitoring",
  "resolved",
  "closed",
]);

export const incidents = pgTable(
  "incidents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    loadId: uuid("load_id")
      .notNull()
      .references(() => loads.id, { onDelete: "restrict" }),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description").notNull(),
    location: varchar("location", { length: 500 }),
    photos: jsonb("photos").$type<string[]>().default([]).notNull(),
    type: incidentTypeEnum("type").notNull(),
    priority: incidentPriorityEnum("priority").notNull(),
    status: incidentStatusEnum("status").default("open").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("incidents_load_id_idx").on(table.loadId),
    index("incidents_status_idx").on(table.status),
    index("incidents_priority_idx").on(table.priority),
    index("incidents_occurred_at_idx").on(table.occurredAt),
  ],
);

export type IncidentRecord = typeof incidents.$inferSelect;
export type NewIncidentRecord = typeof incidents.$inferInsert;
