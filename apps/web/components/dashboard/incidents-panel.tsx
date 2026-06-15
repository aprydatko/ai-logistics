"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CircleAlert, Wrench } from "lucide-react";

import {
  incidentsQueryOptions,
  type IncidentApiItem,
} from "@/lib/incidents/incidents-query";

import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/utils";
import { useRouter } from "next/navigation";

const dashboardIncidentsFilters = {
  search: "",
  priority: "all" as const,
  status: "all" as const,
  occurredFrom: "",
  occurredTo: "",
  page: 1,
  limit: 3,
};

const formatTime = (value: string): string =>
  new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const priorityStyles: Record<
  IncidentApiItem["priority"],
  {
    icon: typeof CircleAlert;
    severity: string;
    style: string;
  }
> = {
  critical: {
    icon: CircleAlert,
    severity: "Critical",
    style: "bg-red-50 text-danger",
  },
  high: {
    icon: CircleAlert,
    severity: "High",
    style: "bg-red-50 text-danger",
  },
  medium: {
    icon: AlertTriangle,
    severity: "Medium",
    style: "bg-orange-50 text-orange-600",
  },
  low: {
    icon: Wrench,
    severity: "Low",
    style: "bg-blue-50 text-blue-600",
  },
};

export function IncidentsPanel(): React.JSX.Element {
  const router = useRouter();
  const { data, isError, isLoading } = useQuery(
    incidentsQueryOptions(dashboardIncidentsFilters),
  );

  const incidents = [...(data?.data ?? [])]
    .sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() -
        new Date(left.updatedAt).getTime(),
    )
    .slice(0, 3);

  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-xs">
      <div className="flex items-center justify-between gap-4 px-2">
        <h2 className="text-sm font-bold text-ink-900">Critical incidents</h2>
        <Button
          onClick={() => router.replace("/incidents")}
          className="text-xs h-auto p-0 text-blue-600"
          variant="link"
        >
          View all
        </Button>
      </div>
      <div className="mt-3 divide-y divide-secondary border border-secondary rounded-sm">
        {isLoading ? (
          <p className="p-3 text-sm text-primary-700">Loading incidents...</p>
        ) : null}
        {isError ? (
          <p className="p-3 text-sm text-danger">
            Unable to load incidents right now.
          </p>
        ) : null}
        {!isLoading && !isError && incidents.length === 0 ? (
          <p className="p-3 text-sm text-primary-700">
            No critical incidents available.
          </p>
        ) : null}
        {incidents.map((incident) => {
          const {
            icon: Icon,
            severity,
            style,
          } = priorityStyles[incident.priority];
          const description =
            incident.location?.trim() ||
            `Load #${incident.load.referenceNumber}`;

          return (
            <div className="flex items-center gap-4 p-3" key={incident.id}>
              <span
                className={cn(
                  "grid size-9 place-items-center rounded-lg",
                  style,
                )}
              >
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs leading-5 font-semibold text-ink-900">
                  {incident.title}
                </p>
                <p className=" truncate text-xs leading-4 text-primary-700">
                  {description}
                </p>
              </div>
              <div className="text-right text-[0.65rem]">
                <p className="leading-4 text-primary-700">
                  {formatTime(incident.updatedAt)}
                </p>
                <p
                  className={cn(
                    "mt-0.5 leading-4 font-semibold",
                    style.split(" ")[1],
                  )}
                >
                  {severity}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}
