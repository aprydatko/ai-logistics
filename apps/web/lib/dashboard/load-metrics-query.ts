import { queryOptions } from "@tanstack/react-query";

import {
  fetchLoads,
  type LoadApiItem,
  type LoadStatus,
  type LoadsFilters,
} from "@/lib/loads/loads-query";

export type LoadMetric = {
  chartData: number[];
  change: string;
  title: string;
  trend?: "negative" | "positive";
  value: string;
};

type LoadMetricsResult = {
  metrics: LoadMetric[];
};

const baseFilters: LoadsFilters = {
  search: "",
  status: "all",
  pickupFrom: "",
  pickupTo: "",
  page: 1,
  limit: 1,
};

const loadStatuses: LoadStatus[] = [
  "pending",
  "assigned",
  "in_transit",
  "delivered",
  "cancelled",
];

const formatPercent = (value: number): string => `${value.toFixed(1)}%`;

const countRecentStatuses = (loads: LoadApiItem[]): number[] => {
  const counts = new Map<LoadStatus, number>(
    loadStatuses.map((status) => [status, 0]),
  );

  for (const load of loads) {
    counts.set(load.status, (counts.get(load.status) ?? 0) + 1);
  }

  return loadStatuses.map((status) => counts.get(status) ?? 0);
};

const getStatusTotal = async (status: LoadStatus): Promise<number> => {
  const response = await fetchLoads({ ...baseFilters, status });
  return response.pagination.total;
};

export const fetchLoadMetrics = async (): Promise<LoadMetricsResult> => {
  const [allLoads, pending, assigned, inTransit, delivered, cancelled] =
    await Promise.all([
      fetchLoads({ ...baseFilters, limit: 12 }),
      getStatusTotal("pending"),
      getStatusTotal("assigned"),
      getStatusTotal("in_transit"),
      getStatusTotal("delivered"),
      getStatusTotal("cancelled"),
    ]);

  const totalLoads = Math.max(
    pending + assigned + inTransit + delivered + cancelled,
    1,
  );
  const activeLoads = assigned + inTransit;
  const recentStatusCounts = countRecentStatuses(allLoads.data);

  return {
    metrics: [
      {
        chartData: recentStatusCounts,
        change: formatPercent((activeLoads / totalLoads) * 100),
        title: "Active loads",
        value: activeLoads.toLocaleString(),
      },
      {
        chartData: recentStatusCounts,
        change: formatPercent((pending / totalLoads) * 100),
        title: "Pending loads",
        value: pending.toLocaleString(),
      },
      {
        chartData: recentStatusCounts,
        change: formatPercent((delivered / totalLoads) * 100),
        title: "Delivered loads",
        value: delivered.toLocaleString(),
      },
      {
        chartData: recentStatusCounts,
        change: formatPercent((cancelled / totalLoads) * 100),
        title: "Cancelled loads",
        trend: "negative",
        value: cancelled.toLocaleString(),
      },
    ],
  };
};

export const loadMetricsQueryOptions = () =>
  queryOptions({
    queryKey: ["dashboard", "load-metrics"],
    queryFn: fetchLoadMetrics,
    staleTime: 30_000,
  });
