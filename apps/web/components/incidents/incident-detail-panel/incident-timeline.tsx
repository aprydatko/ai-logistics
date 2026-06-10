import { cn } from "@repo/ui/lib/utils";
import type { IncidentTimelineEvent } from "@/lib/incidents/incidents-query";

export const IncidentTimeline = ({
  items,
}: {
  items: IncidentTimelineEvent[];
}): React.JSX.Element => (
  <section className="px-5 py-6">
    <div className="flex items-center justify-between border-b border-border pb-4">
      <h3 className="text-base font-bold text-ink-900">AI timeline</h3>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        <span className="size-1.5 rounded-full bg-emerald-500" />
        Live
      </span>
    </div>

    <div>
      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-primary-700">
          No timeline events yet.
        </p>
      ) : null}
      {items.map((item, index) => (
        <div
          className="grid grid-cols-[3.5rem_1.75rem_minmax(0,1fr)] gap-3"
          key={item.id}
        >
          <time className="pt-4 text-sm font-semibold text-primary-700">
            {new Date(item.dateTime).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </time>
          <div className="relative flex justify-center">
            {index < items.length - 1 ? (
              <span className="absolute top-7 bottom-0 w-px bg-border" />
            ) : null}
            <span
              className={cn(
                "relative z-10 mt-3.5 size-5 rounded-full border-2 bg-card shadow-[0_0_0_3px_var(--card)]",
                item.tone === "blue" && "border-blue-500",
                item.tone === "green" && "border-emerald-500",
                item.tone === "red" && "border-red-500",
              )}
            />
            {index < items.length - 1 ? (
              <span
                className={cn(
                  "absolute top-[3.75rem] z-10 size-1 rounded-full",
                  item.tone === "blue" && "bg-blue-500",
                  item.tone === "green" && "bg-emerald-500",
                  item.tone === "red" && "bg-red-500",
                )}
              />
            ) : null}
          </div>
          <div
            className={cn(
              "min-w-0 py-4",
              index < items.length - 1 && "border-b border-border",
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <h4 className="text-sm font-bold text-ink-900">{item.title}</h4>
              <span className="shrink-0 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">
                {item.type}
              </span>
            </div>
            <div className="mt-1.5 text-sm leading-6 text-primary-700">
              <p className="whitespace-pre-line">{item.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </section>
);
