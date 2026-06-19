"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ChartNoAxesColumn } from "lucide-react";
import { useRouter } from "next/navigation";

import { dashboardSuggestionsQueryOptions } from "@/lib/dashboard/suggestions-query";

import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/utils";

const suggestionStyles = {
  info: {
    icon: ChartNoAxesColumn,
    style: "bg-cyan-50 text-cyan-700",
  },
  warning: {
    icon: AlertTriangle,
    style: "bg-orange-50 text-orange-600",
  },
} as const;

export function SuggestionsPanel(): React.JSX.Element {
  const router = useRouter();
  const { data, isError, isLoading } = useQuery(
    dashboardSuggestionsQueryOptions(),
  );
  const suggestions = data?.suggestions ?? [];

  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-xs">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-ink-900">AI suggestions</h2>
          <p className="mt-1 text-xs text-primary-700">
            Live signals from recent AI logs, errors, and usage.
          </p>
        </div>
        <Button
          className="h-auto p-0 text-xs text-blue-600"
          onClick={() => router.push("/ai-logs")}
          variant="link"
        >
          Open logs
        </Button>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {isLoading ? (
          <p className="rounded-sm bg-surface-50 p-3 text-sm text-primary-700">
            Loading suggestions...
          </p>
        ) : null}
        {isError ? (
          <p className="rounded-sm bg-surface-50 p-3 text-sm text-danger">
            Unable to load AI suggestions right now.
          </p>
        ) : null}
        {!isLoading && !isError && suggestions.length === 0 ? (
          <p className="rounded-sm bg-surface-50 p-3 text-sm text-primary-700">
            No AI suggestions available right now.
          </p>
        ) : null}
        {suggestions.map(({ detail, href, id, title, tone }) => {
          const { icon: Icon, style } = suggestionStyles[tone];

          return (
            <div
              className="flex items-center gap-3 rounded-lg bg-surface-50 p-3"
              key={id}
            >
              <span
                className={cn(
                  "grid size-9 place-items-center rounded-lg",
                  style,
                )}
              >
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-ink-900">
                  {title}
                </p>
                <p className="mt-1 text-xs text-primary-700">
                  {detail}
                </p>
              </div>
              <Button
                onClick={() => router.push(href)}
                size="sm"
                type="button"
                variant="outline"
              >
                Inspect
              </Button>
            </div>
          );
        })}
      </div>
    </article>
  );
}
