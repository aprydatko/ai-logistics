import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/utils";

import { suggestedActions } from "./assistant-data";

const toneClasses = {
  amber: "bg-amber-50 text-amber-600",
  blue: "bg-blue-50 text-blue-600",
  teal: "bg-teal-50 text-teal-700",
  violet: "bg-violet-50 text-violet-600",
};

type SuggestedActionsProps = {
  onAction: (message: string) => void;
};

export const SuggestedActions = ({
  onAction,
}: SuggestedActionsProps): React.JSX.Element => (
  <section>
    <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-primary-700">
      Suggested next actions
    </h2>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {suggestedActions.map(({ action, description, icon: Icon, title, tone }) => (
        <article className="flex min-h-44 flex-col rounded-xl border border-border bg-card p-4 shadow-xs" key={title}>
          <div className="flex items-start gap-3">
            <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", toneClasses[tone])}>
              <Icon className="size-4" />
            </span>
            <h3 className="text-sm font-bold leading-5 text-ink-900">{title}</h3>
          </div>
          <p className="mt-3 flex-1 text-xs leading-5 text-primary-700">{description}</p>
          <Button
            className="mt-4 w-full rounded-lg bg-info-soft-background text-primary-700 shadow-none hover:bg-blue-100"
            onClick={() => onAction(`${action}: ${title}`)}
            type="button"
          >
            {action}
          </Button>
        </article>
      ))}
    </div>
  </section>
);
