import { queryOptions } from "@tanstack/react-query";

import { fetchIncidents, type IncidentApiItem } from "@/lib/incidents/incidents-query";
import { fetchLoads, type LoadApiItem } from "@/lib/loads/loads-query";

export type DashboardActivityItem = {
  description: string;
  id: string;
  label: "Incident" | "Load";
  time: string;
  title: string;
  updatedAt: string;
};

type DashboardActivityResult = {
  activities: DashboardActivityItem[];
};

const loadFilters = {
  search: "",
  status: "all" as const,
  pickupFrom: "",
  pickupTo: "",
  page: 1,
  limit: 6,
};

const incidentFilters = {
  search: "",
  priority: "all" as const,
  status: "all" as const,
  occurredFrom: "",
  occurredTo: "",
  page: 1,
  limit: 6,
};

const formatTime = (value: string): string =>
  new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const formatLoadStatus = (status: LoadApiItem["status"]): string =>
  status.replaceAll("_", " ");

const toLoadActivity = (load: LoadApiItem): DashboardActivityItem => ({
  description: `${load.pickupAddress} -> ${load.deliveryAddress}`,
  id: `load-${load.id}`,
  label: "Load",
  time: formatTime(load.updatedAt),
  title: `Load #${load.referenceNumber} status is ${formatLoadStatus(load.status)}`,
  updatedAt: load.updatedAt,
});

const toIncidentActivity = (
  incident: IncidentApiItem,
): DashboardActivityItem => ({
  description: incident.load.driver
    ? `Driver: ${incident.load.driver.firstName} ${incident.load.driver.lastName}`
    : `Load #${incident.load.referenceNumber}`,
  id: `incident-${incident.id}`,
  label: "Incident",
  time: formatTime(incident.updatedAt),
  title: `${incident.title} is ${incident.status}`,
  updatedAt: incident.updatedAt,
});

export const fetchDashboardActivity =
  async (): Promise<DashboardActivityResult> => {
    const [loads, incidents] = await Promise.all([
      fetchLoads(loadFilters),
      fetchIncidents(incidentFilters),
    ]);

    const activities = loads.data
      .map(toLoadActivity)
      .concat(incidents.data.map(toIncidentActivity))
      .sort(
        (left, right) =>
          new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
      )
      .slice(0, 5);

    return { activities };
  };

export const dashboardActivityQueryOptions = () =>
  queryOptions({
    queryKey: ["dashboard", "activity"],
    queryFn: fetchDashboardActivity,
    staleTime: 30_000,
  });
