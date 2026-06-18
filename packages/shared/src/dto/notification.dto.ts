import type { CursorListResponse } from "./api-response.dto.js";
import type {
  Notification,
  NotificationPreference,
} from "../types/notification.js";

export type ListNotificationsQueryDto = {
  cursor?: string;
  limit?: number;
};

export type NotificationListResponse = CursorListResponse<Notification>;

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
  | "ai"
  | "documents"
  | "drivers"
  | "emailFrequency"
  | "incidents"
  | "loads"
  | "system"
>;
