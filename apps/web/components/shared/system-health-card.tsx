import { cn } from '@repo/ui/lib/utils';

type SystemHealthCardProps = {
  className?: string;
};

const healthItems = [
  { label: 'AI services', value: 'Healthy' },
  { label: 'Data sync', value: '2 min ago' },
];

export function SystemHealthCard({
  className,
}: SystemHealthCardProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'border-t border-border px-5 py-5',
        className
      )}
    >
      <p className="text-base font-semibold leading-6 text-ink-900">
        System health
      </p>
      <p className="mt-5 flex items-center gap-2 text-sm leading-5 text-primary-700">
        <span className="size-2.5 rounded-full bg-success" />
        All systems operational
      </p>
      <div className="mt-6 space-y-3 text-sm leading-5 text-primary-700">
        {healthItems.map((item) => (
          <div
            className="grid grid-cols-[1fr_auto_auto] items-center gap-3"
            key={item.label}
          >
            <span>{item.label}</span>
            <span className="font-medium text-primary-700">
              {item.value}
            </span>
            <span className="size-3 rounded-full bg-success" />
          </div>
        ))}
      </div>
      <button className="mt-6 text-sm font-semibold text-info" type="button">
        View all
      </button>
    </div>
  );
}
