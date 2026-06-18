"use client";

import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Document } from "@repo/shared";
import { toast } from "@repo/ui/components/toaster";
import { useRouter } from "next/navigation";
import * as React from "react";

import { syncDocumentCache } from "@/lib/documents/documents-query";
import { connectRealtimeNamespace } from "@/lib/realtime/socket-session";
import {
  appendNotificationPage,
  markNotificationReadInCache,
  notificationsInfiniteQueryOptions,
  notificationsQueryKeys,
  type NotificationsInfiniteData,
  notificationPreferencesQueryOptions,
  notificationUnreadCountQueryOptions,
} from "@/lib/notifications/notifications-query";
import { useNotificationsStore } from "@/stores/notifications-store";

const dashboardQueryPrefixes = [
  ["dashboard", "activity"],
  ["dashboard", "suggestions"],
  ["incidents"],
] as const;

export const RealtimeNotificationsProvider = ({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setPreferencesSnapshot = useNotificationsStore(
    (state) => state.setPreferencesSnapshot,
  );
  const notificationsQuery = useInfiniteQuery(notificationsInfiniteQueryOptions());
  useQuery(notificationUnreadCountQueryOptions());
  const preferencesQuery = useQuery(notificationPreferencesQueryOptions());

  React.useEffect(() => {
    if (preferencesQuery.data) {
      setPreferencesSnapshot(preferencesQuery.data);
    }
  }, [preferencesQuery.data, setPreferencesSnapshot]);

  React.useEffect(() => {
    let cancelled = false;
    let socket: Awaited<ReturnType<typeof connectRealtimeNamespace>> | null =
      null;

    const connect = async (): Promise<void> => {
      try {
        socket = await connectRealtimeNamespace("realtime");
        if (cancelled) return;

        socket.on("notification.created", (notification) => {
          queryClient.setQueryData(
            notificationsQueryKeys.infinite(),
            (current: NotificationsInfiniteData | undefined) =>
              appendNotificationPage(current, notification),
          );
          queryClient.setQueryData(
            notificationsQueryKeys.unreadCount(),
            (current: number | undefined) =>
              notification.readAt ? current ?? 0 : (current ?? 0) + 1,
          );

          if (notificationsQuery.data) {
            toast.info(notification.title, {
              description: notification.message,
              onClick: notification.href
                ? () => router.push(notification.href)
                : undefined,
            });
          }
        });

        socket.on("notification.read", ({ notificationId }) => {
          const readAt = new Date().toISOString();
          queryClient.setQueryData(
            notificationsQueryKeys.infinite(),
            (current: NotificationsInfiniteData | undefined) =>
              markNotificationReadInCache(current, notificationId, readAt),
          );
        });

        socket.on("notifications.unread-count.updated", ({ unreadCount }) => {
          queryClient.setQueryData(
            notificationsQueryKeys.unreadCount(),
            unreadCount,
          );
        });

        socket.on("dashboard.incident-stats.updated", () => {
          for (const queryKey of dashboardQueryPrefixes) {
            void queryClient.invalidateQueries({ queryKey });
          }
        });

        socket.on("document.processing.updated", ({ document }) => {
          const nextDocument = document as Document;
          syncDocumentCache(queryClient, nextDocument);
        });
      } catch {
        return;
      }
    };

    void connect();

    return () => {
      cancelled = true;
      socket?.disconnect();
    };
  }, [
    notificationsQuery.data,
    queryClient,
    router,
  ]);

  return <>{children}</>;
};
