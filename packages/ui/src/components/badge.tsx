import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@repo/ui/lib/utils"

const badgeVariants = cva(
  "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md border font-medium whitespace-nowrap transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none",
  {
    variants: {
      size: {
        default: "gap-1 px-2 py-0.5 text-xs [&>svg]:size-3",
        sm: "gap-0.5 px-1.5 py-px text-[0.65rem] leading-4 [&>svg]:size-2.5",
      },
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground [a&]:hover:bg-destructive/90",
        ghost: "border-transparent text-foreground [a&]:hover:bg-accent",
        link: "border-transparent text-primary underline-offset-4 [a&]:hover:underline",
        outline:
          "border-border bg-transparent text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
)

function Badge({
  asChild = false,
  className,
  size,
  variant,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & {
    asChild?: boolean
  }): React.JSX.Element {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ className, size, variant }))}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
