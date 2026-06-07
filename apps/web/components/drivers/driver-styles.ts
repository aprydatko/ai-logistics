import type { DriverRow, DriverStatus } from "./types";

export const truckStateStyles: Record<DriverRow["truckState"], string> = {
  active: "bg-teal-600",
  idle: "bg-slate-400",
  break: "bg-blue-400",
};

export const driverStatusTone: Record<
  DriverStatus,
  "success" | "neutral" | "info"
> = {
  Break: "info",
  "Off Duty": "neutral",
  "On Duty": "success",
};
