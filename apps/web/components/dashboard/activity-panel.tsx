import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";

const activities = [
  {
    description: "Chicago, IL -> Detroit, MI",
    label: "Event",
    time: "10:24",
    title: "Load #LO-78291 status changed to In Transit",
  },
  {
    description: "Dallas, TX -> Houston, TX",
    label: "AI",
    time: "09:57",
    title: "Delay risk detected for Load #LO-10456",
  },
  {
    description: "Driver: John Smith",
    label: "Document",
    time: "09:31",
    title: "POD uploaded for Load #LO-78288",
  },
];

export function ActivityPanel(): React.JSX.Element {
  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-xs">
      <h2 className="text-sm font-bold text-ink-900">Recent activity</h2>
      <div className="mt-3">
        {activities.map((activity, index) => (
          <div className="relative flex gap-4 pb-3" key={activity.time}>
            {index < activities.length - 1 ? (
              <span className="absolute left-[7px] top-5 h-full w-px bg-blue-400" />
            ) : null}
            <span className="relative z-10 mt-1 size-4 shrink-0 rounded-full border-2 border-blue-500 bg-card" />
            <div className="min-w-0 flex-1 border-b border-secondary pb-1">
              <div className="flex items-start justify-between gap-3">
                <Badge
                  className="bg-surface-100 text-primary-700"
                  size="sm"
                  variant="secondary"
                >
                  {activity.label}
                </Badge>
                <time className="text-xs text-primary-700">
                  {activity.time}
                </time>
              </div>
              <p className="mt-2 text-xs font-medium text-ink-900">
                {activity.title}
              </p>
              <p className="mt-0.5 text-[0.65rem] text-primary-700">
                {activity.description}
              </p>
            </div>
          </div>
        ))}
      </div>
      <Button className="h-auto p-0 text-blue-600" variant="link">
        View all activity
      </Button>
    </article>
  );
}
