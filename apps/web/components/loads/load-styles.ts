import type { LoadPriority, LoadStatus } from "./types";

export const loadStatusTone: Record<
  LoadStatus,
  "success" | "neutral" | "info" | "warning" | "danger"
> = {
  Assigned: "info",
  Cancelled: "neutral",
  Delayed: "warning",
  Delivered: "success",
  "In Transit": "info",
  Pending: "neutral",
};

export const loadPriorityTone: Record<
  LoadPriority,
  "danger" | "info" | "warning"
> = {
  High: "danger",
  Low: "info",
  Medium: "warning",
};
