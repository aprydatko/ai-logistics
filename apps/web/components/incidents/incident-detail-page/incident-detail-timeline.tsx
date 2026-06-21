import { cn } from "@repo/ui/lib/utils";

import type { IncidentTimelineEvent } from "@/lib/incidents/incidents-query";
import { formatDateTime } from "./incident-detail-view-model";

export const IncidentDetailTimeline = ({
  items,
}: {
  items: IncidentTimelineEvent[];
}): React.JSX.Element => {
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-primary-700">
        No timeline events yet.
      </p>
    );
  }

  return (
    <div className="space-y-0">
      {items.map((item, index) => (
        <div className="grid grid-cols-[2rem_1fr] gap-4" key={item.id}>
          <div className="relative flex justify-center">
            {index < items.length - 1 ? (
              <span className="absolute top-8 bottom-0 w-px bg-border" />
            ) : null}
            <span
              className={cn(
                "relative z-10 mt-1 flex size-8 items-center justify-center rounded-full border-2 bg-card ring-4 ring-card",
                item.tone === "blue" && "border-blue-500",
                item.tone === "green" && "border-emerald-500",
                item.tone === "red" && "border-red-500",
              )}
            />
          </div>
          <div
            className={cn(
              "min-w-0 pb-6",
              index < items.length - 1 && "border-b border-border",
            )}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-sm font-bold text-ink-900">{item.title}</h3>
                <p className="mt-1 text-sm leading-6 text-primary-700">
                  {item.description}
                </p>
              </div>
              <time className="shrink-0 text-sm font-medium text-primary-700">
                {formatDateTime(item.dateTime)}
              </time>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
