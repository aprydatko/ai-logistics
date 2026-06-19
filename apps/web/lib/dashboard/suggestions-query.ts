import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import {
  DASHBOARD_QUERY_STALE_TIME,
  dashboardQueryKeys,
  fetchDashboardPayload,
} from "@/lib/dashboard/dashboard-query";

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

const dashboardSuggestionItemSchema = z.object({
  detail: z.string(),
  href: z.string(),
  id: z.string(),
  tone: z.enum(["info", "warning"]),
  title: z.string(),
}) satisfies z.ZodType<DashboardSuggestionItem>;

const dashboardSuggestionsResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    suggestions: z.array(dashboardSuggestionItemSchema),
  }),
});

export const fetchDashboardSuggestions =
  async (): Promise<DashboardSuggestionsResult> => {
    return (
      await fetchDashboardPayload({
        errorMessage: "Unable to load dashboard suggestions",
        path: "/api/loads/suggestions",
        schema: dashboardSuggestionsResponseSchema,
      })
    ).data;
  };

export const dashboardSuggestionsQueryOptions = () =>
  queryOptions({
    queryKey: dashboardQueryKeys.suggestions(),
    queryFn: fetchDashboardSuggestions,
    staleTime: DASHBOARD_QUERY_STALE_TIME,
  });
