"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronUp,
  EllipsisVertical,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import { ActionMenu } from "@repo/ui/components/action-menu";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/select";
import { Textarea } from "@repo/ui/components/textarea";
import { cn } from "@repo/ui/lib/utils";

type TimelineTone = "blue" | "green" | "red";

export type IncidentTimelineEvent = {
  id: string;
  time: string;
  title: string;
  description: string;
  type: string;
  tone: TimelineTone;
};

type EventDraft = Omit<IncidentTimelineEvent, "id" | "tone">;

const initialTimelineEvents: IncidentTimelineEvent[] = [
  {
    id: "detected",
    time: "09:41",
    title: "Incident detected",
    description: "AI system detected potential accident from telematics data.",
    type: "Detection",
    tone: "blue",
  },
  {
    id: "evidence",
    time: "09:42",
    title: "Evidence collected",
    description: "Dashcam clip, GPS, speed, and brake data collected.",
    type: "Collection",
    tone: "green",
  },
  {
    id: "classification",
    time: "09:43",
    title: "AI classification",
    description: "Model confidence: 92%\nType: Rear-end collision",
    type: "AI Analysis",
    tone: "green",
  },
  {
    id: "severity",
    time: "09:44",
    title: "Severity assessment",
    description: "Severity: High\nPotential injuries: Likely",
    type: "Assessment",
    tone: "red",
  },
  {
    id: "actions",
    time: "09:45",
    title: "Suggested actions",
    description:
      "• Check driver wellness\n• Contact emergency services\n• Notify customer",
    type: "Recommendations",
    tone: "red",
  },
  {
    id: "dispatcher",
    time: "09:47",
    title: "Dispatcher notified",
    description: "Alex Dispatcher acknowledged the incident.",
    type: "Action",
    tone: "blue",
  },
];

const emptyDraft: EventDraft = {
  time: "",
  title: "",
  description: "",
  type: "",
};

const eventTypes = [
  "Action",
  "Assessment",
  "Collection",
  "Detection",
  "Note",
  "Update",
];

const getTone = (type: string): TimelineTone => {
  if (type === "Assessment") return "red";
  if (type === "Collection") return "green";
  return "blue";
};

type TimelineTabProps = {
  events: IncidentTimelineEvent[];
  onEventsChange: (events: IncidentTimelineEvent[]) => void;
};

export const TimelineTab = ({
  events,
  onEventsChange,
}: TimelineTabProps): React.JSX.Element => {
  const [isAddingEvent, setIsAddingEvent] = React.useState(true);
  const [draft, setDraft] = React.useState<EventDraft>(emptyDraft);

  const updateDraft = <Key extends keyof EventDraft>(
    key: Key,
    value: EventDraft[Key],
  ): void => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const addEvent = (): void => {
    if (!draft.time || !draft.title || !draft.type) return;

    onEventsChange([
      ...events,
      {
        ...draft,
        id: `event-${Date.now()}`,
        tone: getTone(draft.type),
      },
    ]);
    setDraft(emptyDraft);
    setIsAddingEvent(false);
  };

  return (
    <div className="space-y-6">
      <section>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-ink-900">
              Incident timeline
            </h3>
            <p className="mt-1 text-sm text-primary-700">
              Add timeline events to track the progress of this incident.
            </p>
          </div>
          <Button
            onClick={() => setIsAddingEvent(true)}
            type="button"
            variant="outline"
          >
            <Plus />
            Add event
          </Button>
        </div>

        <div className="mt-4">
          {events.map((event, index) => (
            <div
              className="grid grid-cols-[3.5rem_1.5rem_minmax(0,1fr)] gap-3"
              key={event.id}
            >
              <time className="pt-4 text-xs font-semibold text-primary-700">
                {event.time}
              </time>
              <div className="relative flex justify-center">
                {index < events.length - 1 ? (
                  <span className="absolute top-7 bottom-0 w-px bg-border" />
                ) : null}
                <span
                  className={cn(
                    "relative z-10 mt-4 size-4 rounded-full border-2 bg-white",
                    event.tone === "blue" && "border-blue-500",
                    event.tone === "green" && "border-emerald-500",
                    event.tone === "red" && "border-red-500",
                  )}
                />
              </div>
              <div
                className={cn(
                  "min-w-0 py-4",
                  index < events.length - 1 && "border-b border-border",
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-ink-900">
                      {event.title}
                    </h4>
                    <p className="mt-1 whitespace-pre-line text-sm leading-6 text-primary-700">
                      {event.description}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-md bg-blue-50 px-2 py-1 text-[0.65rem] font-semibold text-blue-600">
                    {event.type}
                  </span>
                  <ActionMenu
                    ariaLabel={`Actions for ${event.title}`}
                    items={[
                      {
                        icon: Pencil,
                        label: "Edit event",
                        onSelect: () => {
                          setDraft({
                            time: event.time,
                            title: event.title,
                            description: event.description,
                            type: event.type,
                          });
                          onEventsChange(
                            events.filter(({ id }) => id !== event.id),
                          );
                          setIsAddingEvent(true);
                        },
                      },
                      {
                        icon: Trash2,
                        label: "Delete event",
                        onSelect: () =>
                          onEventsChange(
                            events.filter(({ id }) => id !== event.id),
                          ),
                        tone: "danger",
                      },
                    ]}
                    trigger={
                      <Button
                        aria-label={`Open actions for ${event.title}`}
                        className="-mt-1 text-primary-700"
                        size="icon-sm"
                        type="button"
                        variant="ghost"
                      >
                        <EllipsisVertical />
                      </Button>
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {isAddingEvent ? (
        <section className="rounded-lg border border-border p-4">
          <button
            className="flex w-full items-center justify-between text-sm font-bold text-ink-900"
            onClick={() => setIsAddingEvent(false)}
            type="button"
          >
            Add new event
            <ChevronUp className="size-4" />
          </button>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <label className="grid gap-2 text-sm font-medium text-primary-700">
              <span>
                Time <span className="text-destructive">*</span>
              </span>
              <Input
                className="h-10 bg-white"
                onChange={(event) => updateDraft("time", event.target.value)}
                type="time"
                value={draft.time}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-primary-700">
              <span>
                Title <span className="text-destructive">*</span>
              </span>
              <Input
                className="h-10 bg-white"
                onChange={(event) => updateDraft("title", event.target.value)}
                placeholder="Event title"
                value={draft.title}
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-primary-700">
              <span>
                Type / Action <span className="text-destructive">*</span>
              </span>
              <Select
                onValueChange={(value) => updateDraft("type", value)}
                value={draft.type}
              >
                <SelectTrigger className="h-10 w-full bg-white">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-primary-700 sm:col-span-3">
              Description
              <div className="relative">
                <Textarea
                  className="min-h-24 resize-none bg-white pb-7"
                  maxLength={1000}
                  onChange={(event) =>
                    updateDraft("description", event.target.value)
                  }
                  placeholder="Enter event description..."
                  value={draft.description}
                />
                <span className="absolute right-3 bottom-2 text-xs text-primary-700">
                  {draft.description.length}/1000
                </span>
              </div>
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <Button
              onClick={() => {
                setDraft(emptyDraft);
                setIsAddingEvent(false);
              }}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              className="bg-primary-700 hover:bg-primary-600"
              disabled={!draft.time || !draft.title || !draft.type}
              onClick={addEvent}
              type="button"
            >
              Add event
            </Button>
          </div>
        </section>
      ) : (
        <button
          className="flex w-full items-center justify-between rounded-lg border border-border px-4 py-3 text-sm font-bold text-ink-900"
          onClick={() => setIsAddingEvent(true)}
          type="button"
        >
          Add new event
          <ChevronDown className="size-4" />
        </button>
      )}
    </div>
  );
};

export { initialTimelineEvents };
