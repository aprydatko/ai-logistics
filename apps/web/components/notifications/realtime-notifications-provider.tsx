"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@repo/ui/components/toaster";
import { useRouter } from "next/navigation";
import * as React from "react";

import { connectRealtimeNamespace } from "@/lib/realtime/socket-session";
import {
  notificationPreferencesQueryOptions,
  notificationsQueryOptions,
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
  const hasHydratedInitialList = useNotificationsStore(
    (state) => state.hasHydratedInitialList,
  );
  const hydrate = useNotificationsStore((state) => state.hydrate);
  const receiveNotification = useNotificationsStore(
    (state) => state.receiveNotification,
  );
  const setPreferencesSnapshot = useNotificationsStore(
    (state) => state.setPreferencesSnapshot,
  );
  const setUnreadCount = useNotificationsStore((state) => state.setUnreadCount);
  const markAsRead = useNotificationsStore((state) => state.markAsRead);

  const notificationsQuery = useQuery(notificationsQueryOptions());
  const unreadCountQuery = useQuery(notificationUnreadCountQueryOptions());
  const preferencesQuery = useQuery(notificationPreferencesQueryOptions());

  React.useEffect(() => {
    if (!notificationsQuery.data || unreadCountQuery.data === undefined) return;
    hydrate(notificationsQuery.data, unreadCountQuery.data);
  }, [hydrate, notificationsQuery.data, unreadCountQuery.data]);

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
          queryClient.setQueryData(["notifications"], (current: unknown) =>
            Array.isArray(current)
              ? [notification, ...current.filter((item) => item?.id !== notification.id)]
              : [notification],
          );
          receiveNotification(notification);

          if (hasHydratedInitialList) {
            toast.info(notification.title, {
              description: notification.message,
              onClick: notification.href ? () => router.push(notification.href) : undefined,
            });
          }
        });

        socket.on("notification.read", ({ notificationId }) => {
          markAsRead(notificationId);
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
        });

        socket.on("notifications.unread-count.updated", ({ unreadCount }) => {
          setUnreadCount(unreadCount);
          queryClient.setQueryData(["notifications", "unread-count"], unreadCount);
        });

        socket.on("dashboard.incident-stats.updated", () => {
          for (const queryKey of dashboardQueryPrefixes) {
            void queryClient.invalidateQueries({ queryKey });
          }
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
    hasHydratedInitialList,
    markAsRead,
    queryClient,
    receiveNotification,
    router,
    setUnreadCount,
  ]);

  return <>{children}</>;
};
