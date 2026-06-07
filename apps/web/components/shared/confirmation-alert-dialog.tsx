"use client";

import { LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/alert-dialog";
import { buttonVariants } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/utils";

interface ConfirmationAlertDialogProps {
  open: boolean;
  title: ReactNode;
  description: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  cancelLabel?: string;
  confirmIcon?: ReactNode;
  confirmVariant?: "default" | "destructive";
  disabled?: boolean;
  pending?: boolean;
  pendingLabel?: string;
}

export const ConfirmationAlertDialog = ({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onOpenChange,
  cancelLabel = "Cancel",
  confirmIcon,
  confirmVariant = "default",
  disabled = false,
  pending = false,
  pendingLabel = "Confirming...",
}: ConfirmationAlertDialogProps): React.JSX.Element => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
      </AlertDialogHeader>

      <AlertDialogFooter>
        <AlertDialogCancel disabled={pending}>{cancelLabel}</AlertDialogCancel>
        <AlertDialogAction
          className={cn(buttonVariants({ variant: confirmVariant }))}
          disabled={disabled || pending}
          onClick={(event) => {
            event.preventDefault();
            onConfirm();
          }}
        >
          {pending ? <LoaderCircle className="animate-spin" /> : confirmIcon}
          {pending ? pendingLabel : confirmLabel}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);
