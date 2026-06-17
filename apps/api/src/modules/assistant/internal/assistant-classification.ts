import type { AssistantReportType } from "./assistant.types";

export const detectReportType = (
  message: string,
): AssistantReportType | undefined => {
  const normalized = message.toLowerCase();
  if (
    !normalized.includes("report") &&
    !normalized.includes("summary") &&
    !normalized.includes("brief")
  ) {
    return undefined;
  }

  if (normalized.includes("incident")) return "incidents";
  if (normalized.includes("driver")) return "drivers";
  if (normalized.includes("load")) return "loads";
  if (normalized.includes("operations")) return "operations";
  return "general";
};

export const detectOperation = ({
  message,
  reportType,
  usedTools,
}: {
  message: string;
  reportType?: AssistantReportType;
  usedTools: string[];
}): string => {
  const normalized = message.toLowerCase();
  if (reportType) {
    return `report:${reportType}`;
  }

  if (
    usedTools.includes("generate_incident_guidance") ||
    normalized.includes("incident") ||
    normalized.includes("accident") ||
    normalized.includes("delay")
  ) {
    return "incident_guidance";
  }

  return "chat";
};
