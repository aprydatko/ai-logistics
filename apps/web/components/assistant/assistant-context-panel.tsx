import { AlertTriangle, ChevronRight, MapPinned, ShieldCheck, Truck, UserRound, X } from "lucide-react";

import { Button } from "@repo/ui/components/button";
import type { AssistantSkill } from "./workspace/types";
import type { AssistantLinkedEntity } from "@repo/shared";

const skills: AssistantSkill[] = [
  { id: "save_document", kind: "skill", label: "Save document" },
];

const capabilities = [
  { detail: "Search live loads and summarize status, route, and assignment context.", icon: Truck, label: "Loads Q&A" },
  { detail: "Find drivers by name, code, truck, status, and recent trip context.", icon: UserRound, label: "Drivers Q&A" },
  { detail: "Review incidents and suggest next steps without changing data.", icon: AlertTriangle, label: "Incident guidance" },
];

type Filter = {
  label: string;
};

type AssistantContextPanelProps = {
  filters: Filter[];
  onAction: (message: string) => void;
  onClose: () => void;
  onRemoveFilter: (label: string) => void;
  recentReferences: AssistantLinkedEntity[];
  onSelectSkill: (skill: AssistantSkill) => void;
};

export const AssistantContextPanel = ({
  filters,
  onAction,
  onClose,
  onRemoveFilter,
  recentReferences,
  onSelectSkill,
}: AssistantContextPanelProps): React.JSX.Element => (
  <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs xl:h-full">
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
      <h2 className="text-base font-bold text-ink-900">
        Context &amp; sources
      </h2>
      <Button
        aria-label="Close context panel"
        onClick={onClose}
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        <X />
      </Button>
    </header>

    <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4 [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb:hover]:bg-primary-600">
      <section>
        <h3 className="text-xs font-bold text-ink-900">Applied filters</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {filters.length > 0 ? (
            filters.map(({ label }) => (
              <button
                className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1.5 text-left text-xs font-semibold text-blue-700 hover:bg-blue-100"
                key={label}
                onClick={() => onRemoveFilter(label)}
                type="button"
              >
                <X className="size-3" />
                {label}
              </button>
            ))
          ) : (
            <p className="text-xs text-primary-700">No filters applied.</p>
          )}
        </div>
      </section>

      <section>
        <h3 className="text-xs font-bold text-ink-900">Assistant can help with</h3>
        <div className="mt-2 divide-y divide-border/60">
          {capabilities.map(({ detail, icon: Icon, label }) => (
            <div className="flex h-10 items-center gap-3" key={label}>
              <Icon className="size-4 text-primary-700" />
              <span className="min-w-0 flex-1">
                <strong className="block text-xs font-medium text-ink-900">
                  {label}
                </strong>
                <span className="block truncate text-[0.65rem] text-primary-700">
                  {detail}
                </span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-xs font-bold text-ink-900">Recent references</h3>
        <div className="mt-2 divide-y divide-border/60">
          {recentReferences.length > 0 ? recentReferences.map((reference) => {
            const Icon =
              reference.type === "load"
                ? Truck
                : reference.type === "driver"
                  ? UserRound
                  : AlertTriangle;

            return (
            <button
              className="flex w-full items-center gap-3 py-3 text-left transition hover:bg-surface-50"
              key={reference.recordId}
              onClick={() => onAction(`What should I know about ${reference.title}?`)}
              type="button"
            >
              <Icon className="size-4 shrink-0 text-primary-700" />
              <span className="min-w-0 flex-1">
                <strong className="block truncate text-xs text-ink-900">
                  {reference.title}
                </strong>
                <span className="mt-0.5 block truncate text-[0.65rem] text-primary-700">
                  {reference.type} · {reference.recordId}
                </span>
              </span>
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[0.65rem] font-semibold text-emerald-700">
                Open
              </span>
            </button>
            );
          }) : (
            <p className="py-2 text-xs text-primary-700">
              Ask about a load, driver, or incident to pin live references here.
            </p>
          )}
        </div>
      </section>

      <section>
        <h3 className="text-xs font-bold text-ink-900">Skills &amp; agents</h3>
        <div className="mt-2 divide-y divide-border/60">
          {skills.map((skill) => (
            <button
              className="flex h-10 w-full items-center gap-3 text-left text-xs font-medium text-ink-900 transition hover:bg-surface-50"
              key={skill.id}
              onClick={() => onSelectSkill(skill)}
              type="button"
            >
              <ShieldCheck className="size-4 text-primary-700" />
              <span className="flex-1">{skill.label}</span>
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[0.65rem] font-semibold text-emerald-700">
                Skill
              </span>
              <ChevronRight className="size-4 text-primary-700" />
            </button>
          ))}
        </div>
      </section>

      <div className="flex gap-3 rounded-xl bg-teal-50 p-3 text-teal-900">
        <MapPinned className="mt-0.5 size-4 shrink-0" />
        <p className="text-[0.68rem] leading-4">
          AI suggestions are based on live data. Review before taking action.
        </p>
      </div>
    </div>
  </aside>
);
