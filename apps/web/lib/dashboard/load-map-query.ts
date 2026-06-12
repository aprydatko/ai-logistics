import { queryOptions } from "@tanstack/react-query";

import type { RouteMapMarker } from "@repo/ui/components/route-map";

import { fetchLoads, type LoadApiItem, type LoadStatus } from "@/lib/loads/loads-query";

type Coordinates = [longitude: number, latitude: number];

export type DashboardLoadMapData = {
  center: Coordinates;
  markers: RouteMapMarker[];
  primaryLoadReference: string | null;
  route: Coordinates[];
};

const defaultCenter: Coordinates = [-87.6298, 41.8781];

const baseFilters = {
  search: "",
  pickupFrom: "",
  pickupTo: "",
  page: 1,
  limit: 100,
} as const;

const activeStatuses: LoadStatus[] = ["assigned", "in_transit"];

const toCoordinates = (load: LoadApiItem): Coordinates[] =>
  load.routePoints.map((point) => [point.longitude, point.latitude]);

const toMarker = (load: LoadApiItem): RouteMapMarker | null => {
  const markerPoint = load.routePoints.at(-1) ?? load.routePoints[0];

  if (!markerPoint) return null;

  return {
    coordinates: [markerPoint.longitude, markerPoint.latitude],
    id: load.id,
    label: `${load.referenceNumber} · ${markerPoint.label}`,
    tone: load.status === "in_transit" ? "warning" : "success",
  };
};

const fetchAllLoadsByStatus = async (
  status: LoadStatus,
): Promise<LoadApiItem[]> => {
  const firstPage = await fetchLoads({
    ...baseFilters,
    status,
  });

  if (firstPage.pagination.totalPages <= 1) {
    return firstPage.data;
  }

  const nextPages = await Promise.all(
    Array.from({ length: firstPage.pagination.totalPages - 1 }, (_, index) =>
      fetchLoads({
        ...baseFilters,
        page: index + 2,
        status,
      }),
    ),
  );

  return firstPage.data.concat(nextPages.flatMap((page) => page.data));
};

export const fetchDashboardLoadMapData =
  async (): Promise<DashboardLoadMapData> => {
    const activeLoads = (
      await Promise.all(activeStatuses.map(fetchAllLoadsByStatus))
    ).flat();

    const markers = activeLoads
      .map(toMarker)
      .filter((marker): marker is RouteMapMarker => marker !== null);
    const primaryLoad =
      activeLoads.find((load) => load.routePoints.length >= 2) ?? null;
    const route = primaryLoad ? toCoordinates(primaryLoad) : [];

    return {
      center: route[0] ?? markers[0]?.coordinates ?? defaultCenter,
      markers,
      primaryLoadReference: primaryLoad?.referenceNumber ?? null,
      route,
    };
  };

export const dashboardLoadMapQueryOptions = () =>
  queryOptions({
    queryKey: ["dashboard", "load-map"],
    queryFn: fetchDashboardLoadMapData,
    staleTime: 30_000,
  });
