import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import type {
  NotificationCategory,
  NotificationChannel,
  NotificationEntityType,
  NotificationPayload,
  NotificationType,
} from "@repo/shared/src/types/notification";

import { users } from "./users";

export const notificationCategoryEnum = pgEnum("notification_category", [
  "loads",
  "drivers",
  "incidents",
  "documents",
  "ai",
  "system",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "incident_created",
  "incident_status_changed",
  "incident_timeline_updated",
  "system",
  "ai_report",
]);

export const notificationEntityTypeEnum = pgEnum("notification_entity_type", [
  "incident",
]);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    category: notificationCategoryEnum("category")
      .$type<NotificationCategory>()
      .notNull(),
    type: notificationTypeEnum("type").$type<NotificationType>().notNull(),
    channels: jsonb("channels")
      .$type<NotificationChannel[]>()
      .default(["in_app"])
      .notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    message: varchar("message", { length: 500 }).notNull(),
    entityType: notificationEntityTypeEnum(
      "entity_type",
    ).$type<NotificationEntityType | null>(),
    entityId: uuid("entity_id"),
    href: varchar("href", { length: 255 }),
    readAt: timestamp("read_at", { withTimezone: true }),
    payload: jsonb("payload")
      .$type<NotificationPayload>()
      .default({})
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("notifications_user_id_idx").on(table.userId),
    index("notifications_read_at_idx").on(table.readAt),
    index("notifications_type_idx").on(table.type),
    index("notifications_created_at_idx").on(table.createdAt),
  ],
);

export type NotificationRecord = typeof notifications.$inferSelect;
export type NewNotificationRecord = typeof notifications.$inferInsert;
