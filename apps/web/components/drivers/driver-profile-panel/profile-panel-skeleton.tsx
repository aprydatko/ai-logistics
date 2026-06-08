import { Skeleton } from "@repo/ui/components/skeleton";

export const ProfilePanelSkeleton = (): React.JSX.Element => (
  <div aria-label="Loading driver details" className="mx-5 mt-4 space-y-4">
    <div className="rounded-md border border-border/70">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-20" />
      </div>
      <div className="grid grid-cols-3 gap-2 p-4">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            className="space-y-3 rounded-md border border-border p-3"
            key={index}
          >
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-3 w-24 max-w-full" />
          </div>
        ))}
      </div>
    </div>
    <span className="sr-only">Loading driver details</span>
  </div>
);
