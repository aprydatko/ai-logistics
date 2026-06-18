"use client";

import { queryOptions } from "@tanstack/react-query";
import type {
  Notification,
  ListNotificationsQueryDto,
  NotificationListResponse,
  NotificationPreference,
  NotificationPreferenceResponse,
  NotificationUnreadCountResponse,
  UpdateNotificationPreferenceDto,
} from "@repo/shared";
import { z } from "zod";

const notificationChannelPreferenceSchema = z.object({
  emailEnabled: z.boolean(),
  inAppEnabled: z.boolean(),
});

const notificationSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  category: z.enum([
    "loads",
    "drivers",
    "incidents",
    "documents",
    "ai",
    "system",
  ]),
  type: z.enum([
    "incident_created",
    "incident_status_changed",
    "incident_timeline_updated",
    "system",
    "ai_report",
  ]),
  channels: z.array(z.enum(["email", "in_app"])),
  title: z.string(),
  message: z.string(),
  entityType: z.enum(["incident"]).optional(),
  entityId: z.string().uuid().optional(),
  href: z.string().optional(),
  readAt: z.string().nullable(),
  payload: z.object({
    href: z.string().optional(),
    incidentId: z.string().uuid().optional(),
    priority: z.enum(["low", "medium", "high", "critical"]).optional(),
    status: z
      .enum(["open", "investigating", "monitoring", "resolved", "closed"])
      .optional(),
    title: z.string().optional(),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
}) satisfies z.ZodType<Notification>;

const notificationListResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(notificationSchema),
  pageInfo: z.object({
    limit: z.number().int().positive(),
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
  }),
}) satisfies z.ZodType<NotificationListResponse>;

const notificationUnreadCountResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    unreadCount: z.number().int().nonnegative(),
  }),
}) satisfies z.ZodType<NotificationUnreadCountResponse>;

const notificationPreferenceSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  emailFrequency: z.enum(["off", "instant", "daily"]),
  ai: notificationChannelPreferenceSchema,
  documents: notificationChannelPreferenceSchema,
  drivers: notificationChannelPreferenceSchema,
  incidents: notificationChannelPreferenceSchema,
  loads: notificationChannelPreferenceSchema,
  system: notificationChannelPreferenceSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
}) satisfies z.ZodType<NotificationPreference>;

const notificationPreferenceResponseSchema = z.object({
  success: z.literal(true),
  data: notificationPreferenceSchema,
}) satisfies z.ZodType<NotificationPreferenceResponse>;

export const fetchNotifications = async (
  query: ListNotificationsQueryDto = {},
): Promise<NotificationListResponse> => {
  const searchParams = new URLSearchParams();
  if (query.cursor) searchParams.set("cursor", query.cursor);
  if (query.limit) searchParams.set("limit", String(query.limit));

  const response = await fetch(
    `/api/notifications${searchParams.size > 0 ? `?${searchParams.toString()}` : ""}`,
    { cache: "no-store" },
  );
  if (!response.ok) throw new Error("Unable to load notifications");
  return notificationListResponseSchema.parse(await response.json());
};

export const fetchNotificationUnreadCount = async (): Promise<number> => {
  const response = await fetch("/api/notifications/unread-count", {
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Unable to load notification unread count");
  return notificationUnreadCountResponseSchema.parse(await response.json()).data
    .unreadCount;
};

export const fetchNotificationPreferences =
  async (): Promise<NotificationPreference> => {
    const response = await fetch("/api/notifications/preferences", {
      cache: "no-store",
    });
    if (!response.ok)
      throw new Error("Unable to load notification preferences");
    return notificationPreferenceResponseSchema.parse(await response.json())
      .data;
  };

export const markNotificationRead = async (
  notificationId: string,
): Promise<Notification> => {
  const response = await fetch(`/api/notifications/${notificationId}/read`, {
    method: "PATCH",
  });
  if (!response.ok) throw new Error("Unable to mark notification as read");
  return notificationSchema.parse(await response.json());
};

export const markAllNotificationsRead = async (): Promise<number> => {
  const response = await fetch("/api/notifications/read-all", {
    method: "PATCH",
  });
  if (!response.ok) throw new Error("Unable to mark all notifications as read");
  return notificationUnreadCountResponseSchema.parse(await response.json()).data
    .unreadCount;
};

export const updateNotificationPreferences = async (
  values: UpdateNotificationPreferenceDto,
): Promise<NotificationPreference> => {
  const response = await fetch("/api/notifications/preferences", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(values),
  });
  if (!response.ok) throw new Error("Unable to save notification preferences");
  return notificationPreferenceResponseSchema.parse(await response.json()).data;
};

export const notificationsQueryOptions = () =>
  queryOptions({
    queryKey: ["notifications"],
    queryFn: () => fetchNotifications(),
  });

export const notificationUnreadCountQueryOptions = () =>
  queryOptions({
    queryKey: ["notifications", "unread-count"],
    queryFn: fetchNotificationUnreadCount,
  });

export const notificationPreferencesQueryOptions = () =>
  queryOptions({
    queryKey: ["notifications", "preferences"],
    queryFn: fetchNotificationPreferences,
  });
