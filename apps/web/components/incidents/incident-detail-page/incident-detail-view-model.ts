import type { Incident } from "../types";

export type IncidentDetailPageProps = {
  incidentId: string;
};

export const priorityTone: Record<
  Incident["priority"],
  "danger" | "warning" | "info"
> = {
  critical: "danger",
  high: "danger",
  low: "info",
  medium: "warning",
};

export const statusTone: Record<
  Incident["status"],
  "danger" | "warning" | "info" | "success" | "neutral"
> = {
  closed: "neutral",
  investigating: "info",
  monitoring: "info",
  open: "danger",
  resolved: "success",
};

export const formatDateTime = (value: string | null): string => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export const getDriverName = (incident: Incident): string => {
  const driver = incident.load.driver;
  if (!driver) return "Unassigned";

  return `${driver.firstName} ${driver.lastName}`;
};
