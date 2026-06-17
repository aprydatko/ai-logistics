import type {
  Notification,
  NotificationPreference,
} from "../types/notification.js";

export type NotificationListResponse = {
  data: Notification[];
  success: true;
};

export type NotificationUnreadCountResponse = {
  data: {
    unreadCount: number;
  };
  success: true;
};

export type NotificationPreferenceResponse = {
  data: NotificationPreference;
  success: true;
};

export type UpdateNotificationPreferenceDto = Pick<
  NotificationPreference,
  "ai" | "documents" | "drivers" | "emailFrequency" | "incidents" | "loads" | "system"
>;
