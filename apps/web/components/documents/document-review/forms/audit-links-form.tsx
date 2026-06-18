"use client";

import type { AuditEvent, AuditEventTone } from "../review-data";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bot,
  FileDown,
  Link2,
  LoaderCircle,
  Plus,
  Save,
  Trash2,
  UserRound,
} from "lucide-react";

import { replaceDocumentAuditEvents } from "@/lib/documents/document-mutations";
import { syncDocumentCache } from "@/lib/documents/documents-query";
import { Button } from "@repo/ui/components/button";
import { toast } from "@repo/ui/components/toaster";

const tones: AuditEventTone[] = ["navy", "violet", "green"];
const kinds: AuditEvent["kind"][] = [
  "uploaded",
  "ai_extraction",
  "load_link",
  "driver_link",
  "custom",
];

const getAuditEventIcon = (kind: AuditEvent["kind"]) =>
  ({
    uploaded: FileDown,
    ai_extraction: Bot,
    load_link: Link2,
    driver_link: UserRound,
    custom: FileDown,
  })[kind];

const createEmptyAuditEvent = (): AuditEvent => ({
  actor: "",
  actorBadge: "",
  kind: "custom",
  icon: FileDown,
  label: "",
  role: "",
  timestamp: new Date().toISOString(),
  tone: "navy",
});

export const AuditLinksForm = ({
  documentId,
  events,
  onChange,
  onSaved,
}: {
  documentId: string;
  events: AuditEvent[];
  onChange: (events: AuditEvent[]) => void;
  onSaved: (events: AuditEvent[]) => void;
}): React.JSX.Element => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () =>
      replaceDocumentAuditEvents({
        documentId,
        events: events.map((event) => ({
          kind: event.kind,
          label: event.label,
          actor: event.actor,
          actorBadge: event.actorBadge,
          role: event.role,
          tone: event.tone,
          timestamp: event.timestamp,
        })),
      }),
    onError: (error) =>
      toast.error("Unable to save audit events", {
        description: error.message,
      }),
    onSuccess: async (updatedDocument) => {
      syncDocumentCache(queryClient, updatedDocument);
      onSaved(
        updatedDocument.auditEvents.map((event) => ({
          actor: event.actor,
          actorBadge: event.actorBadge,
          kind: event.kind,
          icon: getAuditEventIcon(event.kind),
          label: event.label,
          role: event.role,
          timestamp: event.timestamp,
          tone: event.tone,
        })),
      );
      toast.success("Audit events saved");
    },
  });

  return (
    <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Edit audit &amp; links</h2>
          <span className="text-sm text-ink-500">
            {events.length} timeline items
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => onChange([...events, createEmptyAuditEvent()])}
            type="button"
            variant="outline"
          >
            <Plus />
            Add event
          </Button>
          <Button
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
            type="button"
          >
            {mutation.isPending ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Save />
            )}
            {mutation.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
      <div className="mt-4 space-y-4">
        {events.map((event, index) => (
          <div
            className="grid gap-3 rounded-lg border border-border p-4 md:grid-cols-2"
            key={`${event.label}-${index}`}
          >
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-ink-700">Kind</span>
              <select
                className="rounded-md border border-border px-3 py-2 focus:border-info"
                onChange={(inputEvent) =>
                  onChange(
                    events.map((item, itemIndex) =>
                      itemIndex === index
                        ? {
                            ...item,
                            kind: inputEvent.target.value as AuditEvent["kind"],
                            icon: getAuditEventIcon(
                              inputEvent.target.value as AuditEvent["kind"],
                            ),
                          }
                        : item,
                    ),
                  )
                }
                value={event.kind}
              >
                {kinds.map((kind) => (
                  <option key={kind} value={kind}>
                    {kind}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-ink-700">Tone</span>
              <select
                className="rounded-md border border-border px-3 py-2 focus:border-info"
                onChange={(inputEvent) =>
                  onChange(
                    events.map((item, itemIndex) =>
                      itemIndex === index
                        ? {
                            ...item,
                            tone: inputEvent.target.value as AuditEventTone,
                          }
                        : item,
                    ),
                  )
                }
                value={event.tone}
              >
                {tones.map((tone) => (
                  <option key={tone} value={tone}>
                    {tone}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-sm md:col-span-2">
              <span className="font-medium text-ink-700">Label</span>
              <input
                className="rounded-md border border-border px-3 py-2 focus:border-info"
                onChange={(inputEvent) =>
                  onChange(
                    events.map((item, itemIndex) =>
                      itemIndex === index
                        ? { ...item, label: inputEvent.target.value }
                        : item,
                    ),
                  )
                }
                value={event.label}
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-ink-700">Actor</span>
              <input
                className="rounded-md border border-border px-3 py-2 focus:border-info"
                onChange={(inputEvent) =>
                  onChange(
                    events.map((item, itemIndex) =>
                      itemIndex === index
                        ? { ...item, actor: inputEvent.target.value }
                        : item,
                    ),
                  )
                }
                value={event.actor}
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-ink-700">Role</span>
              <input
                className="rounded-md border border-border px-3 py-2 focus:border-info"
                onChange={(inputEvent) =>
                  onChange(
                    events.map((item, itemIndex) =>
                      itemIndex === index
                        ? { ...item, role: inputEvent.target.value }
                        : item,
                    ),
                  )
                }
                value={event.role}
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-ink-700">Actor badge</span>
              <input
                className="rounded-md border border-border px-3 py-2 focus:border-info"
                maxLength={3}
                onChange={(inputEvent) =>
                  onChange(
                    events.map((item, itemIndex) =>
                      itemIndex === index
                        ? { ...item, actorBadge: inputEvent.target.value }
                        : item,
                    ),
                  )
                }
                value={event.actorBadge}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium text-ink-700">Timestamp</span>
                <input
                  className="rounded-md border border-border px-3 py-2 focus:border-info"
                  onChange={(inputEvent) =>
                    onChange(
                      events.map((item, itemIndex) =>
                        itemIndex === index
                          ? {
                              ...item,
                              timestamp: inputEvent.target.value
                                ? new Date(
                                    inputEvent.target.value,
                                  ).toISOString()
                                : null,
                            }
                          : item,
                      ),
                    )
                  }
                  type="datetime-local"
                  value={event.timestamp ? event.timestamp.slice(0, 16) : ""}
                />
              </label>
              <Button
                aria-label={`Remove audit event ${event.label || index + 1}`}
                className="self-end"
                onClick={() =>
                  onChange(events.filter((_, itemIndex) => itemIndex !== index))
                }
                type="button"
                variant="outline"
              >
                <Trash2 />
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
