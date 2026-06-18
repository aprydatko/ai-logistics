import type { Notification, NotificationPreference } from "@repo/shared/src";

import type {
  NotificationPreferenceRecord,
  NotificationRecord,
} from "../../../db/schema";

/**
 * Maps a database notification row to the public DTO shape, normalizing
 * nullable columns to `undefined`/`null` and converting dates to ISO
 * strings so the API contract is JSON-stable.
 *
 * @param record - Raw Drizzle row.
 */
export function toNotification(record: NotificationRecord): Notification {
  return {
    id: record.id,
    userId: record.userId,
    category: record.category,
    type: record.type,
    channels: record.channels,
    title: record.title,
    message: record.message,
    entityType: record.entityType ?? undefined,
    entityId: record.entityId ?? undefined,
    href: record.href ?? undefined,
    readAt: record.readAt?.toISOString() ?? null,
    payload: record.payload,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

/**
 * Maps a database preference row to the grouped-by-category public DTO
 * and converts dates to ISO strings.
 *
 * @param record - Raw Drizzle row.
 */
export function toPreference(
  record: NotificationPreferenceRecord,
): NotificationPreference {
  return {
    id: record.id,
    userId: record.userId,
    emailFrequency: record.emailFrequency,
    ai: {
      emailEnabled: record.aiEmailEnabled,
      inAppEnabled: record.aiInAppEnabled,
    },
    documents: {
      emailEnabled: record.documentsEmailEnabled,
      inAppEnabled: record.documentsInAppEnabled,
    },
    drivers: {
      emailEnabled: record.driversEmailEnabled,
      inAppEnabled: record.driversInAppEnabled,
    },
    incidents: {
      emailEnabled: record.incidentsEmailEnabled,
      inAppEnabled: record.incidentsInAppEnabled,
    },
    loads: {
      emailEnabled: record.loadsEmailEnabled,
      inAppEnabled: record.loadsInAppEnabled,
    },
    system: {
      emailEnabled: record.systemEmailEnabled,
      inAppEnabled: record.systemInAppEnabled,
    },
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}
