"use client";

import { useQuery } from "@tanstack/react-query";

import { dashboardLoadMapQueryOptions } from "@/lib/dashboard/load-map-query";
import { LazyRouteMap } from "@/components/maps/lazy-route-map";
import { DashboardMotionItem } from "./dashboard-motion";
import {
  DashboardMapSkeleton,
  DashboardPanelMessageSkeleton,
} from "./dashboard-skeleton";

export function MapPlaceholder(): React.JSX.Element {
  const { data, isError, isLoading } = useQuery(dashboardLoadMapQueryOptions());

  if (isError) {
    return (
      <DashboardMotionItem>
        <article className="rounded-xl border border-border bg-card p-4 shadow-xs">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-bold text-ink-900">Active loads map</h2>
        </div>
        <p className="mt-3 text-sm text-danger">
          Unable to load the active loads map right now.
        </p>
        </article>
      </DashboardMotionItem>
    );
  }

  if (isLoading || !data) {
    return (
      <DashboardMotionItem>
        <article className="rounded-xl border border-border bg-card p-4 shadow-xs">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-bold text-ink-900">Active loads map</h2>
        </div>
        <div className="mt-3">
          <DashboardMapSkeleton />
        </div>
        </article>
      </DashboardMotionItem>
    );
  }

  return (
    <DashboardMotionItem>
      <article className="rounded-xl border border-border bg-card p-4 shadow-xs">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-ink-900">Active loads map</h2>
          {data.primaryLoadReference ? (
            <p className="mt-1 text-xs text-primary-700">
              Route shown for {data.primaryLoadReference}; markers show all
              active loads.
            </p>
          ) : null}
        </div>
      </div>

      {data.markers.length === 0 ? (
        <div className="mt-3 rounded-sm bg-surface-50 p-3">
          <DashboardPanelMessageSkeleton />
          <p className="mt-3 text-sm text-primary-700">
            No active loads with route coordinates available.
          </p>
        </div>
      ) : (
        <LazyRouteMap
          center={data.center}
          className="mt-3"
          markers={data.markers}
          route={data.route}
          zoom={5}
        />
      )}
      </article>
    </DashboardMotionItem>
  );
}
