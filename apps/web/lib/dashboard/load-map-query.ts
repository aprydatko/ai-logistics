import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import type { RouteMapMarker } from "@repo/ui/components/route-map";

import {
  DASHBOARD_QUERY_STALE_TIME,
  dashboardQueryKeys,
  fetchDashboardPayload,
} from "@/lib/dashboard/dashboard-query";

type Coordinates = [longitude: number, latitude: number];

export type DashboardLoadMapData = {
  center: Coordinates;
  markers: RouteMapMarker[];
  primaryLoadReference: string | null;
  route: Coordinates[];
};

const coordinatesSchema = z.tuple([
  z.number(),
  z.number(),
]) satisfies z.ZodType<Coordinates>;

const routeMapMarkerSchema = z.object({
  coordinates: coordinatesSchema,
  id: z.string(),
  label: z.string(),
  tone: z.enum(["danger", "success", "warning"]).optional(),
}) satisfies z.ZodType<RouteMapMarker>;

const dashboardLoadMapResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    center: coordinatesSchema,
    markers: z.array(routeMapMarkerSchema),
    primaryLoadReference: z.string().nullable(),
    route: z.array(coordinatesSchema),
  }),
});

export const fetchDashboardLoadMapData =
  async (): Promise<DashboardLoadMapData> => {
    return (
      await fetchDashboardPayload({
        errorMessage: "Unable to load the active loads map",
        path: "/api/loads/map",
        schema: dashboardLoadMapResponseSchema,
      })
    ).data;
  };

export const dashboardLoadMapQueryOptions = () =>
  queryOptions({
    queryKey: dashboardQueryKeys.loadMap(),
    queryFn: fetchDashboardLoadMapData,
    staleTime: DASHBOARD_QUERY_STALE_TIME,
  });
