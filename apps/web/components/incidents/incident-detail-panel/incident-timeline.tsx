import {
  BellRing,
  Bot,
  BrainCircuit,
  Camera,
  CircleAlert,
  ListChecks,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@repo/ui/lib/utils";

type TimelineItem = {
  time: string;
  title: string;
  description: React.ReactNode;
  tag: string;
  icon: LucideIcon;
  tone: string;
};

const timelineItems: TimelineItem[] = [
  {
    time: "09:41",
    title: "Incident detected",
    description:
      "AI system detected a potential accident from telematics data.",
    tag: "Detection",
    icon: CircleAlert,
    tone: "border-blue-500 text-blue-500",
  },
  {
    time: "09:42",
    title: "Evidence collected",
    description: "Dashcam clip, GPS, speed, and brake data collected.",
    tag: "Collection",
    icon: Camera,
    tone: "border-cyan-600 text-cyan-600",
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
    icon: BrainCircuit,
    tone: "border-teal-600 text-teal-600",
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
    icon: Bot,
    tone: "border-danger text-danger",
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
    tag: "Recommendation",
    icon: ListChecks,
    tone: "border-danger text-danger",
  },
  {
    time: "09:47",
    title: "Dispatcher notified",
    description: "Alex Dispatcher acknowledged the incident.",
    tag: "Action",
    icon: BellRing,
    tone: "border-blue-500 text-blue-500",
  },
];

export const IncidentTimeline = (): React.JSX.Element => (
  <div className="px-7 py-6">
    {timelineItems.map((item, index) => {
      const Icon = item.icon;
      return (
        <div
          className="grid grid-cols-[3.25rem_1.5rem_1fr] gap-3"
          key={item.title}
        >
          <time className="pt-0.5 text-xs font-semibold text-primary-700">
            {item.time}
          </time>
          <div className="relative flex justify-center">
            {index < timelineItems.length - 1 ? (
              <span className="absolute top-5 bottom-0 w-px bg-border" />
            ) : null}
            <span
              className={cn(
                "relative z-10 flex size-5 items-center justify-center rounded-full border-2 bg-card",
                item.tone,
              )}
            >
              <Icon className="size-2.5" />
            </span>
          </div>
          <div className="min-w-0 pb-7">
            <div className="flex items-start justify-between gap-3">
              <h4 className="text-sm font-bold text-ink-900">{item.title}</h4>
              <span className="shrink-0 rounded bg-info-background px-2 py-1 text-[0.65rem] font-semibold text-info">
                {item.tag}
              </span>
            </div>
            <div className="mt-2 text-sm leading-6 text-primary-700">
              {item.description}
            </div>
          </div>
        </div>
      );
    })}
  </div>
);
