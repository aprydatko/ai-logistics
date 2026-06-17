import type { AssistantReportType } from "./assistant.types";

/**
 * Detects the type of report requested from a user message.
 * Returns undefined if the message does not appear to be a report request.
 *
 * @param message - The user message to analyze
 * @returns The detected report type or undefined
 */
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

/**
 * Detects the operation type based on message content, report type, and tools used.
 * Returns a string identifier for analytics and logging.
 *
 * @param params - The detection parameters
 * @param params.message - The user message
 * @param params.reportType - The detected report type
 * @param params.usedTools - The tools used in the request
 * @returns The operation identifier
 */
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
