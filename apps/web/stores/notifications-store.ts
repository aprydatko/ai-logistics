import type { Notification, NotificationPreference } from "@repo/shared";
import { create } from "zustand";

type NotificationState = {
  hasHydratedInitialList: boolean;
  isPanelOpen: boolean;
  items: Notification[];
  nextCursor: string | null;
  preferencesSnapshot: NotificationPreference | null;
  unreadCount: number;
  appendOlderNotifications: (
    items: Notification[],
    nextCursor: string | null,
  ) => void;
  hydrate: (
    items: Notification[],
    unreadCount: number,
    nextCursor: string | null,
  ) => void;
  markAllAsRead: () => void;
  markAsRead: (notificationId: string) => void;
  receiveNotification: (notification: Notification) => void;
  removeReadState: (notificationId: string) => void;
  setPanelOpen: (isOpen: boolean) => void;
  setPreferencesSnapshot: (preferences: NotificationPreference) => void;
  setUnreadCount: (value: number) => void;
};

const sortNewestFirst = (items: Notification[]): Notification[] =>
  [...items].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );

export const useNotificationsStore = create<NotificationState>((set) => ({
  hasHydratedInitialList: false,
  isPanelOpen: false,
  items: [],
  nextCursor: null,
  preferencesSnapshot: null,
  unreadCount: 0,
  appendOlderNotifications: (items, nextCursor) =>
    set((state) => ({
      items: sortNewestFirst([
        ...state.items,
        ...items.filter((item) => !state.items.some((current) => current.id === item.id)),
      ]),
      nextCursor,
    })),
  hydrate: (items, unreadCount, nextCursor) =>
    set({
      hasHydratedInitialList: true,
      items: sortNewestFirst(items),
      nextCursor,
      unreadCount,
    }),
  markAllAsRead: () =>
    set((state) => ({
      items: state.items.map((item) => ({
        ...item,
        readAt: item.readAt ?? new Date().toISOString(),
      })),
      unreadCount: 0,
    })),
  markAsRead: (notificationId) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === notificationId && !item.readAt
          ? { ...item, readAt: new Date().toISOString() }
          : item,
      ),
      unreadCount: Math.max(
        0,
        state.unreadCount -
          (state.items.some(
            (item) => item.id === notificationId && !item.readAt,
          )
            ? 1
            : 0),
      ),
    })),
  receiveNotification: (notification) =>
    set((state) => ({
      items: sortNewestFirst(
        [
          notification,
          ...state.items.filter((item) => item.id !== notification.id),
        ].slice(0, 100),
      ),
      unreadCount: notification.readAt
        ? state.unreadCount
        : state.unreadCount + 1,
    })),
  removeReadState: (notificationId) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== notificationId),
    })),
  setPanelOpen: (isPanelOpen) => set({ isPanelOpen }),
  setPreferencesSnapshot: (preferencesSnapshot) => set({ preferencesSnapshot }),
  setUnreadCount: (unreadCount) => set({ unreadCount }),
}));
