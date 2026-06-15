import {
  AlertTriangle,
  Bell,
  ChevronRight,
  CloudRain,
  FileText,
  MapPinned,
  Route,
  Truck,
  UserRound,
  UserRoundCog,
  X,
} from "lucide-react";

import { Button } from "@repo/ui/components/button";

const sources = [
  { count: 6, icon: Truck, label: "Loads" },
  { count: 6, icon: UserRound, label: "Drivers" },
  { count: 2, icon: AlertTriangle, label: "Incidents" },
  { count: 1, icon: Route, label: "Traffic" },
  { count: 2, icon: CloudRain, label: "Weather" },
];

const references = [
  { detail: "Dallas, TX → Houston, TX", icon: Truck, label: "LD-10456" },
  { detail: "Chicago, IL → Detroit, MI", icon: Truck, label: "LD-78291" },
  { detail: "Accident on I-94", icon: AlertTriangle, label: "INC-2291" },
  { detail: "TR-1022", icon: UserRound, label: "Driver Sarah Davis" },
];

const safeActions = [
  { icon: Bell, label: "Notify driver" },
  { icon: UserRoundCog, label: "Reassign driver" },
  { icon: Route, label: "Reroute load" },
  { icon: AlertTriangle, label: "Create incident" },
  { icon: FileText, label: "Generate report" },
];

type Filter = {
  label: string;
};

type AssistantContextPanelProps = {
  filters: Filter[];
  onAction: (message: string) => void;
  onClose: () => void;
  onRemoveFilter: (label: string) => void;
};

export const AssistantContextPanel = ({
  filters,
  onAction,
  onClose,
  onRemoveFilter,
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
        <h3 className="text-xs font-bold text-ink-900">Sources (9)</h3>
        <div className="mt-2 divide-y divide-border/60">
          {sources.map(({ count, icon: Icon, label }) => (
            <div className="flex h-10 items-center gap-3" key={label}>
              <Icon className="size-4 text-primary-700" />
              <span className="flex-1 text-xs font-medium text-ink-900">
                {label}
              </span>
              <span className="min-w-8 rounded-full bg-surface-100 px-2 py-1 text-center text-[0.65rem] font-bold text-primary-700">
                {count}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-xs font-bold text-ink-900">References</h3>
        <div className="mt-2 divide-y divide-border/60">
          {references.map(({ detail, icon: Icon, label }) => (
            <button
              className="flex w-full items-center gap-3 py-3 text-left transition hover:bg-surface-50"
              key={label}
              onClick={() => onAction(`Open reference: ${label}`)}
              type="button"
            >
              <Icon className="size-4 shrink-0 text-primary-700" />
              <span className="min-w-0 flex-1">
                <strong className="block truncate text-xs text-ink-900">
                  {label}
                </strong>
                <span className="mt-0.5 block truncate text-[0.65rem] text-primary-700">
                  {detail}
                </span>
              </span>
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[0.65rem] font-semibold text-emerald-700">
                Open
              </span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-xs font-bold text-ink-900">Safe actions</h3>
        <div className="mt-2 divide-y divide-border/60">
          {safeActions.map(({ icon: Icon, label }) => (
            <button
              className="flex h-10 w-full items-center gap-3 text-left text-xs font-medium text-ink-900 transition hover:bg-surface-50"
              key={label}
              onClick={() => onAction(label)}
              type="button"
            >
              <Icon className="size-4 text-primary-700" />
              <span className="flex-1">{label}</span>
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
