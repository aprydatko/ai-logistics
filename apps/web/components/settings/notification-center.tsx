"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { Notification } from "@repo/shared";
import { CheckCheck, ChevronDown, ChevronRight, Search } from "lucide-react";
import * as React from "react";

import { Button } from "@repo/ui/components/button";

import {
  flattenNotificationPages,
  markAllNotificationsReadInCache,
  markNotificationReadInCache,
  markAllNotificationsRead,
  markNotificationRead,
  notificationsInfiniteQueryOptions,
  notificationsQueryKeys,
  type NotificationsInfiniteData,
  notificationUnreadCountQueryOptions,
} from "@/lib/notifications/notifications-query";

const categoryToneClasses: Record<Notification["category"], string> = {
  ai: "bg-violet-50 text-violet-600",
  documents: "bg-teal-50 text-teal-600",
  drivers: "bg-blue-50 text-blue-600",
  incidents: "bg-amber-50 text-amber-500",
  loads: "bg-red-50 text-red-500",
  system: "bg-slate-100 text-slate-600",
};

export const NotificationCenter = (): React.JSX.Element => {
  const queryClient = useQueryClient();
  const notificationsQuery = useInfiniteQuery(
    notificationsInfiniteQueryOptions(),
  );
  const unreadCountQuery = useQuery(notificationUnreadCountQueryOptions());
  const [query, setQuery] = React.useState("");
  const [type, setType] = React.useState<Notification["category"] | "all">(
    "all",
  );

  const markAsReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: (_, notificationId) => {
      const readAt = new Date().toISOString();

      queryClient.setQueryData(
        notificationsQueryKeys.infinite(),
        (current: NotificationsInfiniteData | undefined) =>
          markNotificationReadInCache(current, notificationId, readAt),
      );
      queryClient.setQueryData(
        notificationsQueryKeys.unreadCount(),
        (current: number | undefined) => Math.max(0, (current ?? 0) - 1),
      );
    },
  });
  const markAllAsReadMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: (nextUnreadCount) => {
      const readAt = new Date().toISOString();

      queryClient.setQueryData(
        notificationsQueryKeys.infinite(),
        (current: NotificationsInfiniteData | undefined) =>
          markAllNotificationsReadInCache(current, readAt),
      );
      queryClient.setQueryData(
        notificationsQueryKeys.unreadCount(),
        nextUnreadCount,
      );
    },
  });

  const sourceItems: Notification[] = flattenNotificationPages(
    notificationsQuery.data,
  );
  const filtered = sourceItems.filter((item: Notification) => {
    const matchesType = type === "all" || item.category === type;
    const matchesQuery = `${item.title} ${item.message}`
      .toLowerCase()
      .includes(query.toLowerCase());
    return matchesType && matchesQuery;
  });

  const handleLoadMore = async (): Promise<void> => {
    if (
      !notificationsQuery.hasNextPage ||
      notificationsQuery.isFetchingNextPage
    ) {
      return;
    }

    await notificationsQuery.fetchNextPage();
  };

  return (
    <section className="min-w-0 p-5">
      <h2 className="text-base font-bold text-ink-900">Notification center</h2>
      <div className="mt-4 grid gap-2 sm:grid-cols-[minmax(180px,1fr)_auto_auto]">
        <label className="flex h-10 items-center gap-2 border border-border px-3 text-primary-700 focus-within:border-blue-500">
          <Search className="size-4 shrink-0" />
          <input
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-ink-500"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search notifications"
            value={query}
          />
        </label>
        <Button
          className="h-10 rounded-none"
          disabled={
            markAllAsReadMutation.isPending ||
            (unreadCountQuery.data ?? 0) === 0 ||
            sourceItems.every((item) => item.readAt)
          }
          onClick={() => {
            markAllAsReadMutation.mutate();
          }}
          variant="outline"
        >
          <CheckCheck className="mr-2 size-4" />
          Mark all as read
        </Button>
        <label className="relative">
          <select
            className="h-10 w-full appearance-none border border-border bg-white pl-3 pr-9 text-sm font-medium text-primary-700 outline-none"
            onChange={(event) =>
              setType(event.target.value as Notification["category"] | "all")
            }
            value={type}
          >
            <option value="all">All types</option>
            {["loads", "drivers", "incidents", "documents", "ai", "system"].map(
              (category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ),
            )}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-3 size-4" />
        </label>
      </div>

      <div className="mt-3">
        {filtered.map((item: Notification) => {
          const isUnread = !item.readAt;

          return (
            <button
              className="grid w-full grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-3 border-b border-border/70 py-3 text-left transition hover:bg-surface-50"
              key={item.id}
              onClick={() => {
                if (!isUnread) return;
                markAsReadMutation.mutate(item.id);
              }}
              type="button"
            >
              <span
                className={`flex size-8 items-center justify-center rounded-md text-xs font-semibold uppercase ${categoryToneClasses[item.category]}`}
              >
                {item.category.slice(0, 2)}
              </span>
              <span className="min-w-0">
                <strong className="block truncate text-sm text-ink-900">
                  {item.title}
                </strong>
                <span className="block truncate text-xs text-primary-700">
                  {item.message}
                </span>
              </span>
              <span className="flex items-center gap-3 pl-2 text-xs text-primary-700">
                {new Intl.DateTimeFormat("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  month: "short",
                  day: "numeric",
                }).format(new Date(item.createdAt))}
                {isUnread ? (
                  <span className="size-2 rounded-full bg-blue-600" />
                ) : (
                  <ChevronRight className="size-4 text-slate-400" />
                )}
              </span>
            </button>
          );
        })}
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-ink-500">
            No notifications match your search.
          </div>
        ) : null}
        {query === "" && type === "all" && filtered.length > 0 ? (
          <div className="flex justify-center pt-4">
            <Button
              disabled={
                !notificationsQuery.hasNextPage ||
                notificationsQuery.isFetchingNextPage
              }
              onClick={() => void handleLoadMore()}
              variant="outline"
            >
              {notificationsQuery.isFetchingNextPage
                ? "Loading..."
                : notificationsQuery.hasNextPage
                  ? "Load more"
                  : "All caught up"}
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
};
