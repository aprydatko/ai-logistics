import type { BaseEntity, ISODateString } from "./common.js";

export type IncidentType =
  | "flat_tire"
  | "delay"
  | "accident"
  | "fuel_issue"
  | "maintenance"
  | "other";

export type IncidentPriority = "low" | "medium" | "high" | "critical";

export type IncidentStatus =
  | "open"
  | "investigating"
  | "monitoring"
  | "resolved"
  | "closed";

export interface Incident extends BaseEntity {
  loadId: string;
  title: string;
  description: string;
  location?: string;
  photos?: string[];
  type: IncidentType;
  priority: IncidentPriority;
  status: IncidentStatus;
  occurredAt: ISODateString;
  resolvedAt?: ISODateString;
}
