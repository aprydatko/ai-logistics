import type { ListIncidentsQueryDto } from "../../incidents/dto/list-incidents-query.dto";

export const getOptionalString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

export const getOptionalBoolean = (value: unknown): boolean | undefined =>
  typeof value === "boolean" ? value : undefined;

export const getOptionalDateString = (value: unknown): string | undefined => {
  if (typeof value !== "string" || !value.trim()) {
    return undefined;
  }

  const normalized = value.trim();
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? undefined : normalized;
};

export const getOptionalLimit = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.max(1, Math.min(5, Math.trunc(value)))
    : 5;

export const normalizeIncidentSearchQuery = (
  query: ListIncidentsQueryDto,
): void => {
  const normalizedSearch = query.search?.trim().toLowerCase();
  if (!normalizedSearch) {
    return;
  }

  const extractedStatus = extractIncidentStatus(normalizedSearch);
  const extractedPriority = extractIncidentPriority(normalizedSearch);
  const extractedType = extractIncidentType(normalizedSearch);

  query.status ??= extractedStatus;
  query.priority ??= extractedPriority;
  query.type ??= extractedType;

  const cleanedSearch = normalizedSearch
    .replace(/\binciden\w*\b/g, " ")
    .replace(/\b(open|investigating|monitoring|resolved|closed)\b/g, " ")
    .replace(/\b(low|medium|high|critical)\b/g, " ")
    .replace(/\b(flat tire|flat_tire|delay|accident|fuel issue|fuel_issue|maintenance|other)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  query.search = cleanedSearch.length >= 3 ? cleanedSearch : undefined;
};

const extractIncidentStatus = (
  search: string,
): ListIncidentsQueryDto["status"] | undefined => {
  if (search.includes("investigating")) return "investigating";
  if (search.includes("monitoring")) return "monitoring";
  if (search.includes("resolved")) return "resolved";
  if (search.includes("closed")) return "closed";
  if (search.includes("open")) return "open";
  return undefined;
};

const extractIncidentPriority = (
  search: string,
): ListIncidentsQueryDto["priority"] | undefined => {
  if (search.includes("critical")) return "critical";
  if (search.includes("high")) return "high";
  if (search.includes("medium")) return "medium";
  if (search.includes("low")) return "low";
  return undefined;
};

const extractIncidentType = (
  search: string,
): ListIncidentsQueryDto["type"] | undefined => {
  if (search.includes("flat tire") || search.includes("flat_tire")) {
    return "flat_tire";
  }
  if (search.includes("fuel issue") || search.includes("fuel_issue")) {
    return "fuel_issue";
  }
  if (search.includes("maintenance")) return "maintenance";
  if (search.includes("accident")) return "accident";
  if (search.includes("delay")) return "delay";
  if (search.includes("other")) return "other";
  return undefined;
};
