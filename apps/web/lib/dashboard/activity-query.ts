import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

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
    const response = await fetch("/api/loads/activity", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Unable to load dashboard activity");
    }

    return dashboardActivityResponseSchema.parse(await response.json()).data;
  };

export const dashboardActivityQueryOptions = () =>
  queryOptions({
    queryKey: ["dashboard", "activity"],
    queryFn: fetchDashboardActivity,
    staleTime: 30_000,
  });
