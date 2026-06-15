"use client";

import * as React from "react";
import { Bot, Copy, ExternalLink, Smartphone, X } from "lucide-react";

import { Button } from "@repo/ui/components/button";
import { StatusBadge } from "@repo/ui/components/status-badge";
import { toast } from "@repo/ui/components/toaster";

import type { AiLog } from "./ai-logs-data";

type Props = { log: AiLog; onClose: () => void };

const Detail = ({
  label,
  value,
}: {
  label: string;
  value: string;
}): React.JSX.Element => (
  <div className="grid grid-cols-[7rem_1fr] gap-3 text-sm">
    <dt className="text-ink-500">{label}</dt>
    <dd className="font-medium text-ink-900">{value}</dd>
  </div>
);

export const AiLogDetails = ({ log, onClose }: Props): React.JSX.Element => {
  const [copiedField, setCopiedField] = React.useState<"prompt" | "response" | null>(
    null,
  );

  const copyText = async (
    value: string,
    field: "prompt" | "response",
  ): Promise<void> => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      toast.success(field === "prompt" ? "Prompt copied" : "Response copied");
    } catch {
      toast.error("Copy failed", {
        description: "Clipboard access is unavailable in this browser.",
      });
    }
  };

  React.useEffect(() => {
    if (!copiedField) return;

    const timeoutId = window.setTimeout(() => setCopiedField(null), 2000);
    return () => window.clearTimeout(timeoutId);
  }, [copiedField]);

  React.useEffect(() => {
    setCopiedField(null);
  }, [log.id]);

  return (
    <aside className="min-h-0 w-full shrink-0 overflow-y-auto rounded-lg border border-border bg-card shadow-sm [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin] xl:h-full xl:w-[22rem]">
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-card px-5">
        <h2 className="text-base font-bold">Selected log details</h2>
        <Button
          aria-label="Close details"
          onClick={onClose}
          size="icon-sm"
          variant="ghost"
        >
          <X />
        </Button>
      </header>
      <div className="p-5">
        <div className="flex items-start gap-3 border-b border-border pb-5">
          <span className="grid size-10 place-items-center rounded-lg bg-ai-background text-ai">
            <Bot className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate font-semibold">{log.operation}</p>
              <StatusBadge
                size="sm"
                tone={log.status === "Success" ? "success" : "danger"}
              >
                {log.status}
              </StatusBadge>
            </div>
            <p className="mt-1 text-xs text-ink-500">
              {log.time} · {log.latency}
            </p>
          </div>
        </div>
        <section className="space-y-3 border-b border-border py-5">
          <h3 className="text-sm">Overview</h3>
          <dl className="space-y-2.5">
            <Detail label="Model" value={log.model} />
            <Detail label="Status" value={log.status} />
            <Detail label="Latency" value={log.latency} />
            <Detail
              label="Tokens"
              value={`${log.tokens} (${log.tokenDetail})`}
            />
            <Detail label="Estimated cost" value={log.cost} />
            <Detail label="User" value={log.user} />
            <Detail label="Source" value={log.source} />
          </dl>
        </section>
        <section className="space-y-3 border-b border-border py-5">
          <h3 className="text-sm">Linked to</h3>
          <dl className="space-y-2.5">
            <Detail label="Type" value={log.linkedType} />
            <Detail label="ID" value={log.linkedId} />
            <Detail label="Title" value={log.linkedTitle} />
            {log.route ? <Detail label="Route" value={log.route} /> : null}
          </dl>
        </section>
        <section className="space-y-4 py-5 text-sm">
          <div>
            <h3 className="text-sm">Prompt preview</h3>
            <p className="mt-2 leading-5 text-ink-700">{log.prompt}</p>
          </div>
          <div>
            <h3 className="text-sm">Response preview</h3>
            <p className="mt-2 leading-5 text-ink-700">{log.response}</p>
          </div>
        </section>
        <div className="grid gap-2 border-t border-border pt-5">
          <Button className="justify-start" variant="outline">
            <ExternalLink />
            View full log
          </Button>
          <Button
            className="justify-start"
            onClick={() => void copyText(log.prompt, "prompt")}
            variant="outline"
          >
            <Copy />
            {copiedField === "prompt" ? "Copied prompt" : "Copy prompt"}
          </Button>
          <Button
            className="justify-start"
            onClick={() => void copyText(log.response, "response")}
            variant="outline"
          >
            <Smartphone />
            {copiedField === "response" ? "Copied response" : "Copy response"}
          </Button>
        </div>
      </div>
    </aside>
  );
};
