import * as React from "react";

import { cn } from "@repo/ui/lib/utils";

function Alert({
  className,
  ...props
}: React.ComponentProps<"div">): React.JSX.Element {
  return (
    <div
      role="alert"
      data-slot="alert"
      className={cn(
        "grid w-full grid-cols-[0_1fr] items-start gap-y-0.5 rounded-md border border-destructive/30 bg-danger-background px-4 py-3 text-sm text-danger has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] has-[>svg]:gap-x-3 [&>svg]:size-4 [&>svg]:translate-y-0.5",
        className,
      )}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">): React.JSX.Element {
  return (
    <div
      data-slot="alert-description"
      className={cn("col-start-2 text-sm leading-relaxed", className)}
      {...props}
    />
  );
}

export { Alert, AlertDescription };
