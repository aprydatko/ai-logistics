import { cn } from "@repo/ui/lib/utils";

const Skeleton = ({
  className,
  ...props
}: React.ComponentProps<"div">): React.JSX.Element => (
  <div
    className={cn("animate-pulse rounded-md bg-accent", className)}
    data-slot="skeleton"
    {...props}
  />
);

export { Skeleton };
