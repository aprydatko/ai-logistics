import type {
  IncidentApiItem,
  IncidentsFilters,
} from "@/lib/incidents/incidents-query";

export type Incident = IncidentApiItem;
export type IncidentPriority = Incident["priority"];
export type IncidentStatus = Incident["status"];
export type IncidentFilters = IncidentsFilters;

export const incidentPriorityLabels: Record<IncidentPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const incidentStatusLabels: Record<IncidentStatus, string> = {
  open: "Open",
  investigating: "Investigating",
  monitoring: "Monitoring",
  resolved: "Resolved",
  closed: "Closed",
};

export const incidentTypeLabels: Record<Incident["type"], string> = {
  flat_tire: "Flat tire",
  delay: "Delay",
  accident: "Accident",
  fuel_issue: "Fuel issue",
  maintenance: "Maintenance",
  other: "Other",
};
