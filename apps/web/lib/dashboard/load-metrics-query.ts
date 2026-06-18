import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

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
  const response = await fetch("/api/loads/metrics", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Unable to load load metrics");
  }

  return loadMetricsResponseSchema.parse(await response.json()).data;
};

export const loadMetricsQueryOptions = () =>
  queryOptions({
    queryKey: ["dashboard", "load-metrics"],
    queryFn: fetchLoadMetrics,
    staleTime: 30_000,
  });
