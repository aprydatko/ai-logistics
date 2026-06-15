"use client";

import type { Document } from "@repo/shared";
import { MoreHorizontal } from "lucide-react";

import {
  formatUploadedAt,
  getAuditEvents,
  type AuditEvent,
  type AuditEventTone,
} from "../review-data";

const getToneClassName = (tone: AuditEventTone): string => {
  if (tone === "violet") return "text-ai-600";
  if (tone === "green") return "text-teal-600";
  return "text-primary-700";
};

const getActorBadgeClassName = (tone: AuditEventTone): string =>
  tone === "violet" ? "bg-violet-500" : "bg-primary-700";

export const AuditLinksSection = ({
  document,
  events,
}: {
  document: Document;
  events?: AuditEvent[];
}): React.JSX.Element => {
  const auditEvents = events ?? getAuditEvents(document);

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <h2 className="mb-3 text-base font-semibold">Audit &amp; links</h2>
      <div>
        {auditEvents.map(
          ({ icon: Icon, label, actor, actorBadge, role, timestamp, tone }) => (
            <div
              className="grid grid-cols-[36px_1fr_auto] items-center gap-3 border-t border-border py-2.5 sm:grid-cols-[36px_minmax(180px,1.3fr)_160px_minmax(180px,1fr)_30px]"
              key={`${label}-${actor}-${timestamp ?? "na"}`}
            >
              <span
                className={`relative z-10 flex size-9 items-center justify-center rounded-full border bg-card ${getToneClassName(tone)}`}
              >
                <Icon className="size-4" />
              </span>
              <span className="font-medium text-primary-700">{label}</span>
              <time className="hidden text-sm text-ink-500 sm:block">
                {timestamp ? formatUploadedAt(timestamp) : "Not available"}
              </time>
              <div className="hidden items-center gap-3 sm:flex">
                <span
                  className={`flex size-8 items-center justify-center rounded-full text-xs font-bold text-white ${getActorBadgeClassName(tone)}`}
                >
                  {actorBadge}
                </span>
                <span>
                  <strong className="block text-sm">{actor}</strong>
                  <small className="text-ink-500">{role}</small>
                </span>
              </div>
              <button
                aria-label={`Actions for ${label}`}
                className="text-ink-500"
                type="button"
              >
                <MoreHorizontal className="size-4" />
              </button>
            </div>
          ),
        )}
      </div>
    </section>
  );
};
