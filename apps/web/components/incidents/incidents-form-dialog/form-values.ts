import type { Incident } from "../types";

export type IncidentFormValues = {
  type: string;
  priority: Incident["priority"];
  location: string;
  occurredAt: string;
  status: Incident["status"];
  reportedBy: string;
  description: string;
  load: string;
  driver: string;
};

export const emptyIncidentFormValues: IncidentFormValues = {
  type: "Accident",
  priority: "High",
  location: "",
  occurredAt: "",
  status: "Open",
  reportedBy: "Alex Dispatcher",
  description: "",
  load: "",
  driver: "",
};

export const toIncidentFormValues = (
  incident: Incident | null,
): IncidentFormValues =>
  incident
    ? {
        type: incident.title.replace(/ detected$/i, ""),
        priority: incident.priority,
        location: incident.location,
        occurredAt: "",
        status: incident.status,
        reportedBy: "Alex Dispatcher",
        description: `${incident.title} at ${incident.location}.`,
        load: incident.load ?? "",
        driver: incident.driver?.name ?? "",
      }
    : emptyIncidentFormValues;
