import {
  boolean,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import type { NotificationEmailFrequency } from "@repo/shared/src/types/notification";

import { users } from "./users";

export const notificationEmailFrequencyEnum = pgEnum(
  "notification_email_frequency",
  ["off", "instant", "daily"],
);

export const notificationPreferences = pgTable(
  "notification_preferences",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    emailFrequency: notificationEmailFrequencyEnum("email_frequency")
      .$type<NotificationEmailFrequency>()
      .default("off")
      .notNull(),
    loadsInAppEnabled: boolean("loads_in_app_enabled").default(true).notNull(),
    loadsEmailEnabled: boolean("loads_email_enabled").default(false).notNull(),
    driversInAppEnabled: boolean("drivers_in_app_enabled")
      .default(true)
      .notNull(),
    driversEmailEnabled: boolean("drivers_email_enabled")
      .default(false)
      .notNull(),
    incidentsInAppEnabled: boolean("incidents_in_app_enabled")
      .default(true)
      .notNull(),
    incidentsEmailEnabled: boolean("incidents_email_enabled")
      .default(false)
      .notNull(),
    documentsInAppEnabled: boolean("documents_in_app_enabled")
      .default(false)
      .notNull(),
    documentsEmailEnabled: boolean("documents_email_enabled")
      .default(false)
      .notNull(),
    aiInAppEnabled: boolean("ai_in_app_enabled").default(true).notNull(),
    aiEmailEnabled: boolean("ai_email_enabled").default(false).notNull(),
    systemInAppEnabled: boolean("system_in_app_enabled")
      .default(false)
      .notNull(),
    systemEmailEnabled: boolean("system_email_enabled")
      .default(false)
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("notification_preferences_user_id_unique").on(table.userId)],
);

export type NotificationPreferenceRecord =
  typeof notificationPreferences.$inferSelect;
export type NewNotificationPreferenceRecord =
  typeof notificationPreferences.$inferInsert;
