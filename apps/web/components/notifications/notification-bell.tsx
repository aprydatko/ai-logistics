"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@repo/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@repo/ui/components/popover";

import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications/notifications-query";
import { useNotificationsStore } from "@/stores/notifications-store";

const formatRelativeTime = (value: string): string =>
  new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(
    Math.round((new Date(value).getTime() - Date.now()) / 60_000),
    "minute",
  );

export const NotificationBell = (): React.JSX.Element => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const items = useNotificationsStore((state) => state.items);
  const unreadCount = useNotificationsStore((state) => state.unreadCount);
  const isPanelOpen = useNotificationsStore((state) => state.isPanelOpen);
  const setPanelOpen = useNotificationsStore((state) => state.setPanelOpen);
  const markAsReadLocal = useNotificationsStore((state) => state.markAsRead);
  const markAllAsReadLocal = useNotificationsStore(
    (state) => state.markAllAsRead,
  );

  const markAsReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      void queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });
    },
  });

  const recentItems = items.slice(0, 6);

  return (
    <Popover onOpenChange={setPanelOpen} open={isPanelOpen}>
      <PopoverTrigger asChild>
        <Button
          aria-label="Notifications"
          className="relative text-primary-700"
          size="icon"
          type="button"
          variant="ghost"
        >
          <Bell className="size-6" />
          {unreadCount > 0 ? (
            <span className="absolute -right-[5px] -top-[2px] grid min-w-4 place-items-center rounded-full bg-danger px-1 text-[0.65rem] font-normal leading-none text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[24rem] p-0">
        <PopoverHeader className="border-b border-border px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <PopoverTitle className="text-sm font-semibold text-ink-900">
              Notifications
            </PopoverTitle>
            <Button
              className="h-auto p-0 text-xs text-blue-600"
              disabled={unreadCount === 0 || markAllAsReadMutation.isPending}
              onClick={() => {
                markAllAsReadLocal();
                markAllAsReadMutation.mutate();
              }}
              variant="link"
            >
              <CheckCheck className="mr-1 size-3.5" />
              Mark all read
            </Button>
          </div>
        </PopoverHeader>

        <div className="max-h-[28rem] overflow-y-auto">
          {recentItems.length === 0 ? (
            <p className="px-4 py-6 text-sm text-primary-700">
              No notifications yet.
            </p>
          ) : (
            recentItems.map((item) => (
              <button
                className="flex w-full items-start gap-3 border-b border-border/70 px-4 py-3 text-left transition hover:bg-surface-50"
                key={item.id}
                onClick={() => {
                  if (!item.readAt) {
                    markAsReadLocal(item.id);
                    markAsReadMutation.mutate(item.id);
                  }

                  setPanelOpen(false);
                  if (item.href) router.push(item.href);
                }}
                type="button"
              >
                <span
                  className={`mt-1 size-2 shrink-0 rounded-full ${
                    item.readAt ? "bg-slate-300" : "bg-blue-600"
                  }`}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-ink-900">
                    {item.title}
                  </span>
                  <span className="mt-1 block text-xs text-primary-700">
                    {item.message}
                  </span>
                </span>
                <span className="shrink-0 text-[0.65rem] text-primary-700">
                  {formatRelativeTime(item.createdAt)}
                </span>
              </button>
            ))
          )}
        </div>

        <div className="border-t border-border px-4 py-3">
          <Button
            className="h-auto p-0 text-xs text-blue-600"
            onClick={() => {
              setPanelOpen(false);
              router.push("/settings");
            }}
            variant="link"
          >
            Open notification center
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
