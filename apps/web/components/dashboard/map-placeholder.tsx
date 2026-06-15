"use client";

import { useQuery } from "@tanstack/react-query";

import { dashboardLoadMapQueryOptions } from "@/lib/dashboard/load-map-query";
import { RouteMap } from "@repo/ui/components/route-map";

export function MapPlaceholder(): React.JSX.Element {
  const { data, isError, isLoading } = useQuery(dashboardLoadMapQueryOptions());

  if (isError) {
    return (
      <article className="rounded-xl border border-border bg-card p-4 shadow-xs">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-bold text-ink-900">Active loads map</h2>
        </div>
        <p className="mt-3 text-sm text-danger">
          Unable to load the active loads map right now.
        </p>
      </article>
    );
  }

  if (isLoading || !data) {
    return (
      <article className="rounded-xl border border-border bg-card p-4 shadow-xs">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-bold text-ink-900">Active loads map</h2>
        </div>
        <div className="mt-3 h-72 rounded-xl border border-border bg-surface-100" />
      </article>
    );
  }

  return (
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
        <p className="mt-3 text-sm text-primary-700">
          No active loads with route coordinates available.
        </p>
      ) : (
        <RouteMap
          center={data.center}
          className="mt-3"
          markers={data.markers}
          route={data.route}
          zoom={5}
        />
      )}
    </article>
  );
}
