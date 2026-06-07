import * as React from "react";

import { Badge } from "@repo/ui/components/badge";
import { cn } from "@repo/ui/lib/utils";

type StatusBadgeTone = "success" | "neutral" | "info" | "warning" | "danger";
type StatusBadgeSize = "default" | "lg" | "sm";

type StatusBadgeProps = Omit<React.ComponentProps<typeof Badge>, "size"> & {
  size?: StatusBadgeSize;
  tone?: StatusBadgeTone;
};

const statusBadgeToneStyles: Record<StatusBadgeTone, string> = {
  danger: "bg-danger-background text-danger [&>span]:bg-danger",
  info: "bg-info-background text-info [&>span]:bg-blue-500",
  neutral: "bg-neutral-background/60 text-primary-700 [&>span]:bg-slate-400",
  success: "bg-accent text-teal-600 [&>span]:bg-teal-600",
  warning: "bg-warning-background text-warning [&>span]:bg-warning",
};

const statusBadgeSizeStyles: Record<StatusBadgeSize, string> = {
  default: "h-6 gap-1.5 px-2 text-sm [&>span]:size-1.5",
  lg: "h-8 gap-2 px-4 text-base [&>span]:size-2",
  sm: "h-5 gap-2 px-2 text-[0.7rem] [&>span]:size-1.5",
};

function StatusBadgeDot(): React.JSX.Element {
  return (
    <span data-slot="status-badge-dot" className="shrink-0 rounded-full" />
  );
}

export function StatusBadge({
  children,
  className,
  size = "default",
  tone = "neutral",
  ...props
}: StatusBadgeProps): React.JSX.Element {
  return (
    <Badge
      className={cn(
        "rounded-full border-transparent font-semibold",
        statusBadgeToneStyles[tone],
        statusBadgeSizeStyles[size],
        className,
      )}
      {...props}
    >
      <StatusBadgeDot />
      {children}
    </Badge>
  );
}
