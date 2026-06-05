import { cn } from '@repo/ui/lib/utils';

type PlanCardProps = {
  className?: string;
};

export function PlanCard({
  className,
}: PlanCardProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'px-5 py-5',
        className
      )}
    >
      <p className="text-base font-semibold leading-6 text-ink-900">Plan</p>
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="text-base font-semibold text-ink-900">
          Professional
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-success-background px-3 py-1 text-sm font-semibold text-success shadow-[0_0_0_1px_rgba(22,101,52,0.04)]">
          <span className="size-2.5 rounded-full bg-success" />
          Active
        </span>
      </div>
      <p className="mt-2 text-sm leading-5 text-primary-700">
        Next billing: Jun 1, 2026
      </p>
    </div>
  );
}
