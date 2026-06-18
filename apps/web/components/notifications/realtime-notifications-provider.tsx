"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Document,
  DocumentsListResponse,
  Notification,
  NotificationListResponse,
} from "@repo/shared";
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

const updateDocumentsList = (
  current: DocumentsListResponse | undefined,
  nextDocument: Document,
): DocumentsListResponse | undefined => {
  if (!current) return current;
  if (!Array.isArray(current.data)) return current;

  return {
    ...current,
    data: current.data.map((document) =>
      document.id === nextDocument.id ? nextDocument : document,
    ),
  };
};

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
    hydrate(
      notificationsQuery.data.data,
      unreadCountQuery.data,
      notificationsQuery.data.pageInfo.nextCursor,
    );
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
          queryClient.setQueryData<NotificationListResponse>(
            ["notifications"],
            (current: NotificationListResponse | undefined) =>
              current
                ? {
                    ...current,
                    data: [
                      notification,
                      ...current.data.filter(
                        (item: Notification) => item.id !== notification.id,
                      ),
                    ],
                  }
                : {
                    success: true,
                    data: [notification],
                    pageInfo: {
                      limit: 20,
                      nextCursor: null,
                      hasMore: false,
                    },
                  },
          );
          receiveNotification(notification);

          if (hasHydratedInitialList) {
            toast.info(notification.title, {
              description: notification.message,
              onClick: notification.href
                ? () => router.push(notification.href)
                : undefined,
            });
          }
        });

        socket.on("notification.read", ({ notificationId }) => {
          markAsRead(notificationId);
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
        });

        socket.on("notifications.unread-count.updated", ({ unreadCount }) => {
          setUnreadCount(unreadCount);
          queryClient.setQueryData(
            ["notifications", "unread-count"],
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

          queryClient.setQueriesData(
            { queryKey: ["documents"] },
            (current: DocumentsListResponse | undefined) =>
              updateDocumentsList(current, nextDocument),
          );
          queryClient.setQueryData(
            ["documents", nextDocument.id],
            nextDocument,
          );
          void queryClient.invalidateQueries({ queryKey: ["documents"] });
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
