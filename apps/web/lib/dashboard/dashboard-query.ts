import type { QueryClient } from "@tanstack/react-query";
import { z } from "zod";

export const DASHBOARD_QUERY_STALE_TIME = 30_000;

export const dashboardQueryKeys = {
  all: ["dashboard"] as const,
  activity: () => [...dashboardQueryKeys.all, "activity"] as const,
  loadMap: () => [...dashboardQueryKeys.all, "load-map"] as const,
  loadMetrics: () => [...dashboardQueryKeys.all, "load-metrics"] as const,
  suggestions: () => [...dashboardQueryKeys.all, "suggestions"] as const,
};

const dashboardRefreshTargets = {
  drivers: [dashboardQueryKeys.activity(), dashboardQueryKeys.suggestions()],
  incidents: [dashboardQueryKeys.activity(), dashboardQueryKeys.suggestions()],
  loads: [
    dashboardQueryKeys.activity(),
    dashboardQueryKeys.loadMap(),
    dashboardQueryKeys.loadMetrics(),
    dashboardQueryKeys.suggestions(),
  ],
} as const;

export type DashboardRefreshScope = keyof typeof dashboardRefreshTargets;

export const invalidateDashboardQueries = async (
  queryClient: QueryClient,
  scope: DashboardRefreshScope,
): Promise<void> => {
  await Promise.all(
    dashboardRefreshTargets[scope].map((queryKey) =>
      queryClient.invalidateQueries({ queryKey }),
    ),
  );
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
