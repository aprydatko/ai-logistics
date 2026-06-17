import {
  AlertTriangle,
  ChevronRight,
  MapPinned,
  ShieldCheck,
  Truck,
  UserRound,
  X,
} from 'lucide-react';

import type { AssistantLinkedEntity } from '@repo/shared';
import { Button } from '@repo/ui/components/button';
import type { AssistantSkill } from './workspace/types';

const skills: AssistantSkill[] = [
  { id: 'save_document', kind: 'skill', label: 'Save document' },
];

const capabilities = [
  {
    detail:
      'Search live loads and summarize status, route, and assignment context.',
    icon: Truck,
    label: 'Loads Q&A',
  },
  {
    detail:
      'Find drivers by name, code, truck, status, and recent trip context.',
    icon: UserRound,
    label: 'Drivers Q&A',
  },
  {
    detail: 'Review incidents and suggest next steps without changing data.',
    icon: AlertTriangle,
    label: 'Incident guidance',
  },
];

type AssistantContextPanelProps = {
  onAction: (message: string) => void;
  onClose: () => void;
  recentReferences: AssistantLinkedEntity[];
  onSelectSkill: (skill: AssistantSkill) => void;
};

export const AssistantContextPanel = ({
  onAction,
  onClose,
  recentReferences,
  onSelectSkill,
}: AssistantContextPanelProps): React.JSX.Element => (
  <aside className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.1)] xl:h-full">
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-7">
      <h2 className="text-base font-bold  text-slate-950">
        Context &amp; sources
      </h2>
      <Button
        aria-label="Close context panel"
        className="size-8 rounded-full text-slate-950 hover:bg-slate-100"
        onClick={onClose}
        size="icon-sm"
        type="button"
        variant="ghost"
      >
        <X className="size-4" strokeWidth={2} />
      </Button>
    </header>

    <div className="min-h-0 flex-1 overflow-y-auto px-7 py-8 [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb:hover]:bg-primary-600">
      <div className="space-y-2">
        <section>
          <h3 className="text-sm font-bold tracking-[-0.03em] text-slate-950">
            Assistant can help with
          </h3>
          <div className="mt-5">
            {capabilities.map(({ detail, icon: Icon, label }, index) => (
              <article className="flex gap-5" key={label}>
                <span className="mt-4 shrink-0 text-[#173965]">
                  <Icon className="size-5" strokeWidth={2} />
                </span>
                <span
                  className={`min-w-0 flex-1 pb-4 ${
                    index < capabilities.length - 1
                      ? 'mb-3 border-b border-slate-200'
                      : ''
                  }`}
                >
                  <strong className="block text-sm font-bold tracking-[-0.025em] text-slate-950">
                    {label}
                  </strong>
                  <span className="mt-1 block truncate text-xs leading-6 text-[#24476f]">
                    {detail}
                  </span>
                </span>
              </article>
            ))}
          </div>
        </section>

        <section>
          {recentReferences.length > 0 ? (
            <div className="mt-4 divide-y divide-slate-200">
              {recentReferences.map((reference) => {
                const Icon =
                  reference.type === 'load'
                    ? Truck
                    : reference.type === 'driver'
                      ? UserRound
                      : AlertTriangle;

                return (
                  <button
                    className="group flex w-full items-center gap-3 py-4 text-left transition hover:bg-slate-50/70"
                    key={reference.recordId}
                    onClick={() =>
                      onAction(`What should I know about ${reference.title}?`)
                    }
                    type="button"
                  >
                    <span className="shrink-0 text-slate-700">
                      <Icon className="size-5" strokeWidth={1.9} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <strong className="block truncate text-[0.95rem] font-semibold tracking-[-0.02em] text-slate-950">
                        {reference.title}
                      </strong>
                      <span className="mt-1 block truncate text-sm text-slate-600">
                        {reference.type} · {reference.recordId}
                      </span>
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[0.72rem] font-semibold text-emerald-700">
                      Open
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-4">
              <p className="max-w-[19rem] text-sm leading-7 text-[#24476f]">
                Ask about a load, driver, or incident to pin live references
                here.
              </p>
            </div>
          )}
        </section>

        <section className="mt-4">
          <h3 className="text-sm font-bold tracking-[-0.03em] text-slate-950">
            Skills &amp; agents
          </h3>
          <div className="mt-7">
            {skills.map((skill) => (
              <button
                className="group flex w-full items-center gap-5 rounded-2xl border border-transparent bg-slate-50/70 px-4 py-3 text-left shadow-[0_0_0_rgba(15,23,42,0)] transition duration-200 hover:-translate-y-0.5 hover:border-slate-200 hover:bg-white hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#173965]/20 focus-visible:ring-offset-2 active:translate-y-0 active:shadow-[0_8px_18px_rgba(15,23,42,0.08)] cursor-pointer"
                key={skill.id}
                onClick={() => onSelectSkill(skill)}
                type="button"
              >
                <span className="shrink-0 rounded-2xl bg-white p-2 text-[#173965] ring-1 ring-slate-200 transition group-hover:ring-[#173965]/20">
                  <ShieldCheck className="size-5" strokeWidth={1.5} />
                </span>
                <span className="min-w-0 flex-1 text-xs font-bold tracking-[-0.025em] text-slate-950">
                  {skill.label}
                </span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[0.8rem] font-bold text-emerald-700 transition group-hover:bg-emerald-100">
                  Skill
                </span>
                <ChevronRight className="size-5 text-[#173965] transition duration-200 group-hover:translate-x-1" />
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>

    <div className="shrink-0 border-t border-slate-200 p-4">
      <div className="flex gap-4 rounded-md bg-[linear-gradient(135deg,#ecfbf8_0%,#ebfaf4_45%,#eefafa_100%)] px-2 py-3 text-emerald-950">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl text-emerald-700">
          <MapPinned className="size-6" strokeWidth={1.5} />
        </span>
        <div className="text-xs leading-6 text-emerald-900">
          <p>AI suggestions are based on live data.</p>
          <p>Review before taking action.</p>
        </div>
      </div>
    </div>
  </aside>
);
