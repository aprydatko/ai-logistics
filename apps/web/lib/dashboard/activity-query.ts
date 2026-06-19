import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import {
  DASHBOARD_QUERY_STALE_TIME,
  dashboardQueryKeys,
  fetchDashboardPayload,
} from "@/lib/dashboard/dashboard-query";

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
const dashboardActivityItemSchema = z.object({
  description: z.string(),
  id: z.string(),
  label: z.enum(["Incident", "Load"]),
  time: z.string(),
  title: z.string(),
  updatedAt: z.string(),
}) satisfies z.ZodType<DashboardActivityItem>;

const dashboardActivityResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    activities: z.array(dashboardActivityItemSchema),
  }),
});

export const fetchDashboardActivity =
  async (): Promise<DashboardActivityResult> => {
    return (
      await fetchDashboardPayload({
        errorMessage: "Unable to load dashboard activity",
        path: "/api/loads/activity",
        schema: dashboardActivityResponseSchema,
      })
    ).data;
  };

export const dashboardActivityQueryOptions = () =>
  queryOptions({
    queryKey: dashboardQueryKeys.activity(),
    queryFn: fetchDashboardActivity,
    staleTime: DASHBOARD_QUERY_STALE_TIME,
  });
