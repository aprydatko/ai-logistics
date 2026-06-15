import { queryOptions } from "@tanstack/react-query";

import {
  fetchIncidents,
  type IncidentApiItem,
} from "@/lib/incidents/incidents-query";
import { fetchLoads, type LoadApiItem } from "@/lib/loads/loads-query";

export type DashboardSuggestionItem = {
  detail: string;
  href: string;
  id: string;
  tone: "info" | "warning";
  title: string;
};

type DashboardSuggestionsResult = {
  suggestions: DashboardSuggestionItem[];
};

const loadFilters = {
  search: "",
  status: "all" as const,
  pickupFrom: "",
  pickupTo: "",
  page: 1,
  limit: 12,
};

const incidentFilters = {
  search: "",
  priority: "all" as const,
  status: "all" as const,
  occurredFrom: "",
  occurredTo: "",
  page: 1,
  limit: 8,
};

const hoursBetween = (value: string, now: number): number =>
  Math.max(1, Math.round((now - new Date(value).getTime()) / 3_600_000));

const toPendingLoadSuggestion = (
  load: LoadApiItem,
): DashboardSuggestionItem | null => {
  if (load.driver || load.status !== "pending") return null;

  return {
    detail: `${load.pickupAddress} -> ${load.deliveryAddress}`,
    href: "/loads",
    id: `load-pending-${load.id}`,
    title: `Assign driver for Load #${load.referenceNumber}`,
    tone: "info",
  };
};

const toDelayRiskSuggestion = (
  load: LoadApiItem,
  now: number,
): DashboardSuggestionItem | null => {
  if (load.status !== "assigned" && load.status !== "in_transit") return null;

  const deliveryTime = new Date(load.deliveryDate).getTime();
  if (Number.isNaN(deliveryTime) || deliveryTime >= now) return null;

  const delayHours = hoursBetween(load.deliveryDate, now);

  return {
    detail: `ETA exceeded by ${delayHours}h for ${load.deliveryAddress}`,
    href: "/loads",
    id: `load-delay-${load.id}`,
    title: `Delay risk for Load #${load.referenceNumber}`,
    tone: "warning",
  };
};

const toIncidentSuggestion = (
  incident: IncidentApiItem,
): DashboardSuggestionItem | null => {
  if (incident.status === "resolved" || incident.status === "closed")
    return null;
  if (incident.priority !== "critical" && incident.priority !== "high")
    return null;

  const detail = incident.location?.trim()
    ? incident.location
    : incident.load.driver
      ? `Driver: ${incident.load.driver.firstName} ${incident.load.driver.lastName}`
      : `Load #${incident.load.referenceNumber}`;

  return {
    detail,
    href: "/incidents",
    id: `incident-${incident.id}`,
    title: `Escalate ${incident.title}`,
    tone: "warning",
  };
};

export const fetchDashboardSuggestions =
  async (): Promise<DashboardSuggestionsResult> => {
    const [loads, incidents] = await Promise.all([
      fetchLoads(loadFilters),
      fetchIncidents(incidentFilters),
    ]);

    const now = Date.now();
    const suggestions = incidents.data
      .map(toIncidentSuggestion)
      .concat(loads.data.map(toPendingLoadSuggestion))
      .concat(loads.data.map((load) => toDelayRiskSuggestion(load, now)))
      .filter((item): item is DashboardSuggestionItem => item !== null)
      .slice(0, 3);

    return { suggestions };
  };

export const dashboardSuggestionsQueryOptions = () =>
  queryOptions({
    queryKey: ["dashboard", "suggestions"],
    queryFn: fetchDashboardSuggestions,
    staleTime: 30_000,
  });
