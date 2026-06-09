import type { LoadStatus } from "@/lib/loads/loads-query";

export const loadStatusTone: Record<
  LoadStatus,
  "success" | "neutral" | "info" | "warning" | "danger"
> = {
  pending: "neutral",
  assigned: "info",
  in_transit: "warning",
  delivered: "success",
  cancelled: "danger",
};
