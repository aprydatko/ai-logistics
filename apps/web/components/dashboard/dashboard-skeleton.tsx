import { Skeleton } from "@repo/ui/components/skeleton";

export function DashboardPanelMessageSkeleton(): React.JSX.Element {
  return <Skeleton className="h-12 w-full rounded-lg" />;
}

export function DashboardTimelineSkeleton({
  items = 3,
}: {
  items?: number;
}): React.JSX.Element {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, index) => (
        <div className="flex gap-4" key={index}>
          <Skeleton className="mt-1 size-4 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2 rounded-xl border border-border p-3">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-3 w-14" />
            </div>
            <Skeleton className="h-3 w-40 max-w-full" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardListSkeleton({
  items = 3,
}: {
  items?: number;
}): React.JSX.Element {
  return (
    <div className="space-y-2 rounded-sm border border-secondary">
      {Array.from({ length: items }).map((_, index) => (
        <div className="flex items-center gap-4 p-3" key={index}>
          <Skeleton className="size-9 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-32 max-w-full" />
            <Skeleton className="h-3 w-24 max-w-full" />
          </div>
          <div className="space-y-2 text-right">
            <Skeleton className="ml-auto h-3 w-12" />
            <Skeleton className="ml-auto h-3 w-14" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardMapSkeleton(): React.JSX.Element {
  return <Skeleton className="h-72 rounded-xl border border-border" />;
}
