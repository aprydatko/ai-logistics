import type { BaseEntity } from "./common.js";
import type { IncidentPriority, IncidentStatus } from "./incident.js";

export type NotificationCategory =
  | "loads"
  | "drivers"
  | "incidents"
  | "documents"
  | "ai"
  | "system";

export type NotificationType =
  | "incident_created"
  | "incident_status_changed"
  | "incident_timeline_updated"
  | "system"
  | "ai_report";

export type NotificationChannel = "email" | "in_app";

export type NotificationEntityType = "incident";

export type NotificationEmailFrequency = "daily" | "instant" | "off";

export interface NotificationPayload {
  href?: string;
  incidentId?: string;
  priority?: IncidentPriority;
  status?: IncidentStatus;
  title?: string;
}

export interface Notification extends BaseEntity {
  userId: string;
  category: NotificationCategory;
  type: NotificationType;
  channels: NotificationChannel[];
  title: string;
  message: string;
  entityType?: NotificationEntityType;
  entityId?: string;
  href?: string;
  readAt?: string | null;
  payload: NotificationPayload;
}

export interface NotificationChannelPreference {
  emailEnabled: boolean;
  inAppEnabled: boolean;
}

export interface NotificationPreference extends BaseEntity {
  userId: string;
  emailFrequency: NotificationEmailFrequency;
  ai: NotificationChannelPreference;
  documents: NotificationChannelPreference;
  drivers: NotificationChannelPreference;
  incidents: NotificationChannelPreference;
  loads: NotificationChannelPreference;
  system: NotificationChannelPreference;
}
