import type { Incident } from "../types";

export type IncidentFormValues = {
  title: string;
  type: Incident["type"];
  priority: Incident["priority"];
  location: string;
  occurredAt: string;
  status: Incident["status"];
  reportedBy: string;
  description: string;
  loadId: string;
};

export const emptyIncidentFormValues: IncidentFormValues = {
  title: "",
  type: "accident",
  priority: "high",
  location: "",
  occurredAt: "",
  status: "open",
  reportedBy: "Alex Dispatcher",
  description: "",
  loadId: "",
};

export const toIncidentFormValues = (
  incident: Incident | null,
): IncidentFormValues =>
  incident
    ? {
        title: incident.title,
        type: incident.type,
        priority: incident.priority,
        location: incident.location ?? "",
        occurredAt: incident.occurredAt.slice(0, 16),
        status: incident.status,
        reportedBy: "Alex Dispatcher",
        description: incident.description,
        loadId: incident.loadId,
      }
    : emptyIncidentFormValues;
