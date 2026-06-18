"use client";

import "@repo/ui/map.css";

import { useEffect, useState } from "react";

import { cn } from "@repo/ui/lib/utils";
import type { RouteMapProps } from "@repo/ui/components/route-map";

type RouteMapComponent = (props: RouteMapProps) => React.JSX.Element;

export function LazyRouteMap(props: RouteMapProps): React.JSX.Element {
  const [RouteMapComponent, setRouteMapComponent] =
    useState<RouteMapComponent | null>(null);

  useEffect(() => {
    let isActive = true;

    void import("@repo/ui/components/route-map").then((module) => {
      if (isActive) {
        setRouteMapComponent(() => module.RouteMap);
      }
    });

    return () => {
      isActive = false;
    };
  }, []);

  if (!RouteMapComponent) {
    return (
      <div
        aria-hidden="true"
        className={cn(
          "h-72 min-h-64 animate-pulse rounded-xl border border-border bg-surface-100",
          props.className,
        )}
      />
    );
  }

  return <RouteMapComponent {...props} />;
}
