import { Skeleton } from "@repo/ui/components/skeleton";

export const IncidentDetailSkeleton = (): React.JSX.Element => (
  <main className="space-y-5">
    <div className="space-y-3">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-10 w-full max-w-xl" />
      <Skeleton className="h-5 w-full max-w-lg" />
    </div>
    <section className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
      <Skeleton className="h-80 rounded-xl" />
      <Skeleton className="h-80 rounded-xl" />
    </section>
    <Skeleton className="h-96 rounded-xl" />
  </main>
);
