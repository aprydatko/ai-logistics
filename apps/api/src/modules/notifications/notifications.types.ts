import type {
  Notification,
  NotificationCategory,
  NotificationChannel,
  NotificationPreference,
  NotificationType,
} from "@repo/shared/src";

export type NotificationRecipient = {
  email: string;
  firstName: string;
  id: string;
  lastName: string;
};

export type CreateNotificationInput = {
  category: NotificationCategory;
  entityId?: string;
  entityType?: "incident";
  href?: string;
  message: string;
  payload: Notification["payload"];
  title: string;
  type: NotificationType;
};

export type NotificationDeliveryInput = {
  channels: NotificationChannel[];
  notification: Notification;
  preference: NotificationPreference;
  recipient: NotificationRecipient;
};
