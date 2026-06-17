"use client";

import { CircleCheck, CircleX, Info, X, type LucideIcon } from "lucide-react";
import { Toast as ToastPrimitive } from "radix-ui";
import * as React from "react";

import { cn } from "@repo/ui/lib/utils";

export type ToastPosition =
  | "bottom-center"
  | "bottom-left"
  | "bottom-right"
  | "top-center"
  | "top-left"
  | "top-right";

type ToastVariant = "error" | "info" | "success";

type ToastOptions = {
  description?: string;
  duration?: number;
  onClick?: () => void;
};

type ToastItem = ToastOptions & {
  id: string;
  title: string;
  variant: ToastVariant;
};

const TOAST_EVENT = "repo-ui-toast";

const showToast = (
  variant: ToastVariant,
  title: string,
  options: ToastOptions = {},
): void => {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<ToastItem>(TOAST_EVENT, {
      detail: {
        ...options,
        id: crypto.randomUUID(),
        title,
        variant,
      },
    }),
  );
};

export const toast = {
  error: (title: string, options?: ToastOptions): void =>
    showToast("error", title, options),
  info: (title: string, options?: ToastOptions): void =>
    showToast("info", title, options),
  success: (title: string, options?: ToastOptions): void =>
    showToast("success", title, options),
};

const positionStyles: Record<ToastPosition, string> = {
  "bottom-center": "bottom-0 left-1/2 -translate-x-1/2",
  "bottom-left": "bottom-0 left-0",
  "bottom-right": "right-0 bottom-0",
  "top-center": "top-0 left-1/2 -translate-x-1/2",
  "top-left": "top-0 left-0",
  "top-right": "top-0 right-0",
};

const variantStyles: Record<ToastVariant, { icon: LucideIcon; root: string }> =
  {
    error: {
      icon: CircleX,
      root: "border-danger/30 bg-danger-background text-danger",
    },
    info: {
      icon: Info,
      root: "border-info/30 bg-info-background text-info",
    },
    success: {
      icon: CircleCheck,
      root: "border-success/30 bg-success-background text-success",
    },
  };

type ToasterProps = {
  duration?: number;
  position?: ToastPosition;
};

export const Toaster = ({
  duration = 3000,
  position = "bottom-right",
}: ToasterProps): React.JSX.Element => {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  React.useEffect(() => {
    const handleToast = (event: Event): void => {
      const toastEvent = event as CustomEvent<ToastItem>;
      setToasts((currentToasts) => [...currentToasts, toastEvent.detail]);
    };

    window.addEventListener(TOAST_EVENT, handleToast);
    return () => window.removeEventListener(TOAST_EVENT, handleToast);
  }, []);

  const removeToast = (toastId: string): void => {
    setToasts((currentToasts) =>
      currentToasts.filter(({ id }) => id !== toastId),
    );
  };

  return (
    <ToastPrimitive.Provider duration={duration} swipeDirection="right">
      {toasts.map((item) => {
        const Icon = variantStyles[item.variant].icon;

        return (
          <ToastPrimitive.Root
            className={cn(
              "grid grid-cols-[auto_1fr_auto] items-start gap-x-3 rounded-lg border p-4 shadow-lg data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-80 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-right-full",
              item.onClick ? "cursor-pointer" : "",
              variantStyles[item.variant].root,
            )}
            duration={item.duration}
            key={item.id}
            onOpenChange={(open) => {
              if (!open) removeToast(item.id);
            }}
            onClick={() => item.onClick?.()}
          >
            <Icon aria-hidden="true" className="mt-0.5 size-5" />
            <div className="min-w-0">
              <ToastPrimitive.Title className="text-sm font-semibold">
                {item.title}
              </ToastPrimitive.Title>
              {item.description ? (
                <ToastPrimitive.Description className="mt-1 text-xs leading-relaxed opacity-90">
                  {item.description}
                </ToastPrimitive.Description>
              ) : null}
            </div>
            <ToastPrimitive.Close
              aria-label="Close notification"
              className="rounded-sm p-0.5 opacity-70 transition hover:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <X className="size-4" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        );
      })}
      <ToastPrimitive.Viewport
        className={cn(
          "fixed z-[100] flex max-h-screen w-full max-w-sm flex-col gap-2 p-4 outline-none",
          position.startsWith("top-") ? "flex-col" : "flex-col-reverse",
          positionStyles[position],
        )}
      />
    </ToastPrimitive.Provider>
  );
};
