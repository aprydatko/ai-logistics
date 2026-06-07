import { AlertTriangle, CircleAlert, Wrench } from 'lucide-react';

import { Button } from '@repo/ui/components/button';
import { cn } from '@repo/ui/lib/utils';

const incidents = [
  {
    description: 'I-94, Michigan',
    icon: CircleAlert,
    severity: 'High',
    style: 'bg-red-50 text-danger',
    time: '09:42',
    title: 'Accident detected',
  },
  {
    description: 'Load #LO-78291',
    icon: AlertTriangle,
    severity: 'Medium',
    style: 'bg-orange-50 text-orange-600',
    time: '08:15',
    title: 'Delay risk',
  },
  {
    description: 'Truck TR-1042',
    icon: Wrench,
    severity: 'Low',
    style: 'bg-blue-50 text-blue-600',
    time: '07:58',
    title: 'Maintenance alert',
  },
];

export function IncidentsPanel(): React.JSX.Element {
  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-xs">
      <div className="flex items-center justify-between gap-4 px-2">
        <h2 className="text-sm font-bold text-ink-900">Critical incidents</h2>
        <Button className="text-xs h-auto p-0 text-blue-600" variant="link">
          View all
        </Button>
      </div>
      <div className="mt-3 divide-y divide-secondary border border-secondary rounded-sm">
        {incidents.map(
          ({ description, icon: Icon, severity, style, time, title }) => (
            <div className="flex items-center gap-4 p-3" key={title}>
              <span
                className={cn(
                  'grid size-9 place-items-center rounded-lg',
                  style
                )}
              >
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs leading-5 font-semibold text-ink-900">
                  {title}
                </p>
                <p className=" truncate text-xs leading-4 text-primary-700">
                  {description}
                </p>
              </div>
              <div className="text-right text-[0.65rem]">
                <p className="leading-4 text-primary-700">{time}</p>
                <p
                  className={cn(
                    'mt-0.5 leading-4 font-semibold',
                    style.split(' ')[1]
                  )}
                >
                  {severity}
                </p>
              </div>
            </div>
          )
        )}
      </div>
    </article>
  );
}
