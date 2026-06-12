"use client";

import { useState } from "react";
import {
  Bot,
  CalendarDays,
  CheckCheck,
  Filter,
  MapPin,
  PanelRightOpen,
  Sparkles,
  X,
} from "lucide-react";

import { Button } from "@repo/ui/components/button";

import { AssistantComposer } from "./assistant-composer";
import { AssistantContextPanel } from "./assistant-context-panel";
import { AssistantResults } from "./assistant-results";
import { SuggestedActions } from "./suggested-actions";

const initialFilters = [
  { icon: CalendarDays, label: "Date: May 24 – May 28" },
  { icon: Sparkles, label: "Status: Delayed, Open" },
  { icon: MapPin, label: "Region: Midwest" },
];

export const AssistantWorkspace = (): React.JSX.Element => {
  const [filters, setFilters] = useState(initialFilters);
  const [draft, setDraft] = useState("");
  const [model, setModel] = useState("gpt-4.1");
  const [isContextOpen, setIsContextOpen] = useState(true);
  const [message, setMessage] = useState(
    "Show me delayed loads in the Midwest yesterday and suggest next actions.",
  );

  const submit = (): void => {
    const nextMessage = draft.trim();
    if (!nextMessage) return;
    setMessage(nextMessage);
    setDraft("");
  };

  const removeFilter = (label: string): void => {
    setFilters((current) => current.filter((filter) => filter.label !== label));
  };

  return (
    <section
      className={`grid min-h-0 gap-4 xl:h-full ${
        isContextOpen ? "xl:grid-cols-[minmax(0,1fr)_22rem]" : ""
      }`}
    >
      <div className="flex min-h-0 flex-col gap-4">
        <header className="flex shrink-0 items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl leading-9 text-ink-900">AI Assistant</h1>
            <p className="max-w-2xl text-sm text-primary-700">
              Ask questions, get insights, suggested actions and reports.
            </p>
          </div>
          {!isContextOpen ? (
            <Button onClick={() => setIsContextOpen(true)} type="button" variant="outline">
              <PanelRightOpen className="size-4" />
              Context
            </Button>
          ) : null}
        </header>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <span className="inline-flex h-9 items-center gap-2 rounded-lg bg-surface-100 px-3 text-xs font-semibold text-ink-900">
            <Filter className="size-3.5" />
            Active filters ({filters.length})
          </span>
          {filters.map(({ icon: Icon, label }) => (
            <button
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-blue-50 px-3 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
              key={label}
              onClick={() => removeFilter(label)}
              type="button"
            >
              <Icon className="size-3.5" />
              {label}
              <X className="size-3.5" />
            </button>
          ))}
          {filters.length > 0 ? (
            <button className="px-2 text-xs font-semibold text-blue-600 hover:text-blue-800" onClick={() => setFilters([])} type="button">
              Clear all
            </button>
          ) : null}
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto rounded-xl border border-border bg-card py-4 pl-4 pr-2 [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin] sm:py-5 sm:pl-5 sm:pr-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-button]:h-2 [&::-webkit-scrollbar-track]:my-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb:hover]:bg-primary-600">
            <div className="ml-auto flex max-w-2xl items-start gap-3">
              <div className="flex-1 rounded-2xl rounded-tr-sm bg-blue-100/80 px-5 py-4 shadow-xs">
                <p className="text-sm leading-6 text-ink-900">{message}</p>
                <p className="mt-2 flex items-center justify-end gap-1 text-[0.65rem] font-medium text-blue-600">
                  09:41 <CheckCheck className="size-3.5" />
                </p>
              </div>
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-700 text-white">
                <Bot className="size-5" />
              </span>
            </div>

            <div className="space-y-5 pl-4">
              <AssistantResults />
              <SuggestedActions onAction={setDraft} />
              <p className="text-right text-[0.65rem] text-primary-700">View ✓</p>
            </div>
          </div>

          <AssistantComposer
            draft={draft}
            model={model}
            onDraftChange={setDraft}
            onModelChange={setModel}
            onSubmit={submit}
          />
        </div>
      </div>

      {isContextOpen ? (
        <AssistantContextPanel
          filters={filters}
          onAction={setDraft}
          onClose={() => setIsContextOpen(false)}
          onRemoveFilter={removeFilter}
        />
      ) : null}
    </section>
  );
};
