import type { BaseEntity, ISODateString } from "./common.js";

export type IncidentSeverity = "low" | "medium" | "high" | "critical";

export type IncidentStatus = "open" | "investigating" | "resolved";

export interface Incident extends BaseEntity {
  loadId: string;
  driverId: string;

  title: string;
  description: string;

  photos?: string[];

  severity: IncidentSeverity;
  status: IncidentStatus;

  reportedAt: ISODateString;
  resolvedAt?: ISODateString;
}
