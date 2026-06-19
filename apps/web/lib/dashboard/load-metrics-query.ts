import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import {
  DASHBOARD_QUERY_STALE_TIME,
  dashboardQueryKeys,
  fetchDashboardPayload,
} from "@/lib/dashboard/dashboard-query";

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
const loadMetricSchema = z.object({
  chartData: z.array(z.number()),
  change: z.string(),
  title: z.string(),
  trend: z.enum(["negative", "positive"]).optional(),
  value: z.string(),
}) satisfies z.ZodType<LoadMetric>;

const loadMetricsResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    metrics: z.array(loadMetricSchema),
  }),
});

export const fetchLoadMetrics = async (): Promise<LoadMetricsResult> => {
  return (
    await fetchDashboardPayload({
      errorMessage: "Unable to load load metrics",
      path: "/api/loads/metrics",
      schema: loadMetricsResponseSchema,
    })
  ).data;
};

export const loadMetricsQueryOptions = () =>
  queryOptions({
    queryKey: dashboardQueryKeys.loadMetrics(),
    queryFn: fetchLoadMetrics,
    staleTime: DASHBOARD_QUERY_STALE_TIME,
  });
