import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { z } from "zod";

export const incidentTypeSchema = z.enum([
  "flat_tire",
  "delay",
  "accident",
  "fuel_issue",
  "maintenance",
  "other",
]);
export const incidentPrioritySchema = z.enum([
  "low",
  "medium",
  "high",
  "critical",
]);
export const incidentStatusSchema = z.enum([
  "open",
  "investigating",
  "monitoring",
  "resolved",
  "closed",
]);
export const incidentTimelineEventSchema = z.object({
  id: z.string(),
  dateTime: z.string(),
  title: z.string(),
  description: z.string(),
  type: z.string(),
  tone: z.enum(["blue", "green", "red"]),
});

export const incidentSchema = z.object({
  id: z.string().uuid(),
  loadId: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  location: z.string().nullable(),
  photos: z.array(z.string()),
  timeline: z.array(incidentTimelineEventSchema),
  type: incidentTypeSchema,
  priority: incidentPrioritySchema,
  status: incidentStatusSchema,
  occurredAt: z.string(),
  resolvedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  load: z.object({
    id: z.string().uuid(),
    referenceNumber: z.string(),
    driver: z
      .object({
        id: z.string().uuid(),
        firstName: z.string(),
        lastName: z.string(),
        avatarUrl: z.string().nullable(),
        truckNumber: z.string().nullable(),
      })
      .nullable(),
  }),
});

const incidentsResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(incidentSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
});

export type IncidentApiItem = z.infer<typeof incidentSchema>;
export type IncidentTimelineEvent = z.infer<
  typeof incidentTimelineEventSchema
>;
export type IncidentsFilters = {
  search: string;
  priority: IncidentApiItem["priority"] | "all";
  status: IncidentApiItem["status"] | "all";
  occurredFrom: string;
  occurredTo: string;
  page: number;
  limit: number;
};

const toSearchParams = (filters: IncidentsFilters): URLSearchParams => {
  const params = new URLSearchParams({
    page: String(filters.page),
    limit: String(filters.limit),
    sortBy: "occurredAt",
    sortOrder: "desc",
  });
  if (filters.search) params.set("search", filters.search);
  if (filters.priority !== "all") params.set("priority", filters.priority);
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.occurredFrom) params.set("occurredFrom", filters.occurredFrom);
  if (filters.occurredTo) params.set("occurredTo", filters.occurredTo);
  return params;
};

export const fetchIncidents = async (
  filters: IncidentsFilters,
): Promise<z.infer<typeof incidentsResponseSchema>> => {
  const response = await fetch(`/api/incidents?${toSearchParams(filters)}`);
  if (!response.ok) throw new Error("Unable to load incidents");
  return incidentsResponseSchema.parse(await response.json());
};

export const incidentsQueryOptions = (filters: IncidentsFilters) =>
  queryOptions({
    placeholderData: keepPreviousData,
    queryKey: ["incidents", filters],
    queryFn: () => fetchIncidents(filters),
  });
