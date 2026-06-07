import { AlertTriangle, Bot } from 'lucide-react';

import { Button } from '@repo/ui/components/button';
import { cn } from '@repo/ui/lib/utils';

const suggestions = [
  {
    detail: 'Driver is 2h behind schedule',
    icon: Bot,
    style: 'bg-blue-50 text-blue-600',
    title: 'Reassign driver for Load #LD-2156',
  },
  {
    detail: 'Traffic congestion predicted',
    icon: AlertTriangle,
    style: 'bg-orange-50 text-orange-600',
    title: 'Delay risk for Load #LD-10456',
  },
];

export function SuggestionsPanel(): React.JSX.Element {
  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-xs">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-bold text-ink-900">AI suggestions</h2>
        <Button className="text-xs h-auto p-0 text-blue-600" variant="link">
          View all
        </Button>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {suggestions.map(({ detail, icon: Icon, style, title }) => (
          <div
            className="flex items-center gap-3 p-3 bg-surface-50"
            key={title}
          >
            <span
              className={cn('grid size-9 place-items-center rounded-lg', style)}
            >
              <Icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-ink-900">
                {title}
              </p>
              <p className="mt-1 truncate text-xs text-primary-700">{detail}</p>
            </div>
            <Button size="sm" variant="outline">
              Review
            </Button>
          </div>
        ))}
      </div>
    </article>
  );
}
