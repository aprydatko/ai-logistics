import { z } from "zod";

export const DASHBOARD_QUERY_STALE_TIME = 30_000;

export const dashboardQueryKeys = {
  all: ["dashboard"] as const,
  activity: () => [...dashboardQueryKeys.all, "activity"] as const,
  loadMap: () => [...dashboardQueryKeys.all, "load-map"] as const,
  loadMetrics: () => [...dashboardQueryKeys.all, "load-metrics"] as const,
  suggestions: () => [...dashboardQueryKeys.all, "suggestions"] as const,
};

export const fetchDashboardPayload = async <TResult>({
  errorMessage,
  path,
  schema,
}: {
  errorMessage: string;
  path: string;
  schema: z.ZodType<TResult>;
}): Promise<TResult> => {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(errorMessage);
  }

  return schema.parse(await response.json());
};
