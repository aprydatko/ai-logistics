import type { NotificationPreference } from "@repo/shared";
import { create } from "zustand";

type NotificationState = {
  isPanelOpen: boolean;
  preferencesSnapshot: NotificationPreference | null;
  setPanelOpen: (isOpen: boolean) => void;
  setPreferencesSnapshot: (preferences: NotificationPreference) => void;
};

export const useNotificationsStore = create<NotificationState>((set) => ({
  isPanelOpen: false,
  preferencesSnapshot: null,
  setPanelOpen: (isPanelOpen) => set({ isPanelOpen }),
  setPreferencesSnapshot: (preferencesSnapshot) => set({ preferencesSnapshot }),
}));
