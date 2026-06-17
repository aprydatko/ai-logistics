import type { Notification, NotificationPreference } from "@repo/shared";
import { create } from "zustand";

type NotificationState = {
  hasHydratedInitialList: boolean;
  isPanelOpen: boolean;
  items: Notification[];
  preferencesSnapshot: NotificationPreference | null;
  unreadCount: number;
  hydrate: (items: Notification[], unreadCount: number) => void;
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
  preferencesSnapshot: null,
  unreadCount: 0,
  hydrate: (items, unreadCount) =>
    set({
      hasHydratedInitialList: true,
      items: sortNewestFirst(items),
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
          (state.items.some((item) => item.id === notificationId && !item.readAt)
            ? 1
            : 0),
      ),
    })),
  receiveNotification: (notification) =>
    set((state) => ({
      items: sortNewestFirst(
        [notification, ...state.items.filter((item) => item.id !== notification.id)].slice(0, 100),
      ),
      unreadCount: notification.readAt ? state.unreadCount : state.unreadCount + 1,
    })),
  removeReadState: (notificationId) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== notificationId),
    })),
  setPanelOpen: (isPanelOpen) => set({ isPanelOpen }),
  setPreferencesSnapshot: (preferencesSnapshot) => set({ preferencesSnapshot }),
  setUnreadCount: (unreadCount) => set({ unreadCount }),
}));
