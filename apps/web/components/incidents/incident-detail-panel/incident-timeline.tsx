import { cn } from "@repo/ui/lib/utils";

type TimelineItem = {
  time: string;
  title: string;
  description: React.ReactNode;
  tag: string;
  tone: "blue" | "green" | "red";
};

const timelineItems: TimelineItem[] = [
  {
    time: "09:41",
    title: "Detected",
    description:
      "AI system detected a potential accident from telematics data.",
    tag: "Detection",
    tone: "blue",
  },
  {
    time: "09:42",
    title: "Evidence collected",
    description: "Dashcam clip, GPS, speed, and brake data collected.",
    tag: "Collection",
    tone: "green",
  },
  {
    time: "09:43",
    title: "AI classification",
    description: (
      <>
        Model confidence: 92%
        <br />
        Type: Rear-end collision
      </>
    ),
    tag: "AI Analysis",
    tone: "green",
  },
  {
    time: "09:44",
    title: "Severity assessment",
    description: (
      <>
        Severity: High
        <br />
        Potential injuries: Likely
      </>
    ),
    tag: "Assessment",
    tone: "red",
  },
  {
    time: "09:45",
    title: "Suggested actions",
    description: (
      <ul className="list-disc space-y-1 pl-4">
        <li>Check driver wellness</li>
        <li>Contact emergency services</li>
        <li>Notify customer</li>
      </ul>
    ),
    tag: "Recommendations",
    tone: "red",
  },
  {
    time: "09:47",
    title: "Dispatcher notified",
    description: "Alex Dispatcher acknowledged the incident.",
    tag: "Action",
    tone: "blue",
  },
];

export const IncidentTimeline = (): React.JSX.Element => (
  <section className="px-5 py-6">
    <div className="flex items-center justify-between border-b border-border pb-4">
      <h3 className="text-base font-bold text-ink-900">AI timeline</h3>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
        <span className="size-1.5 rounded-full bg-emerald-500" />
        Live
      </span>
    </div>

    <div>
      {timelineItems.map((item, index) => (
        <div
          className="grid grid-cols-[3.5rem_1.75rem_minmax(0,1fr)] gap-3"
          key={item.title}
        >
          <time className="pt-4 text-sm font-semibold text-primary-700">
            {item.time}
          </time>
          <div className="relative flex justify-center">
            {index < timelineItems.length - 1 ? (
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
            {index < timelineItems.length - 1 ? (
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
              index < timelineItems.length - 1 && "border-b border-border",
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <h4 className="text-sm font-bold text-ink-900">{item.title}</h4>
              <span className="shrink-0 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">
                {item.tag}
              </span>
            </div>
            <div className="mt-1.5 text-sm leading-6 text-primary-700">
              {item.description}
            </div>
          </div>
        </div>
      ))}
    </div>
  </section>
);
