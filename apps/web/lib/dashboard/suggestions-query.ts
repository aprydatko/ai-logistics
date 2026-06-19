import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

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
    const response = await fetch("/api/loads/suggestions", {
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error("Unable to load dashboard suggestions");
    }

    return dashboardSuggestionsResponseSchema.parse(await response.json()).data;
  };

export const dashboardSuggestionsQueryOptions = () =>
  queryOptions({
    queryKey: ["dashboard", "suggestions"],
    queryFn: fetchDashboardSuggestions,
    staleTime: 30_000,
  });
