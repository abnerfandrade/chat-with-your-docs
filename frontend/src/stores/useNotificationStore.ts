import { create } from "zustand";

export type NotificationTone = "info" | "success" | "error";

export type NotificationItem = {
  id: string;
  title: string;
  description?: string;
  tone: NotificationTone;
};

type NotificationState = {
  notifications: NotificationItem[];
  pushNotification: (notification: Omit<NotificationItem, "id">) => string;
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;
};

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  pushNotification: (notification) => {
    const id = crypto.randomUUID();

    set((state) => ({
      notifications: [...state.notifications, { id, ...notification }],
    }));

    return id;
  },
  dismissNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter(
        (notification) => notification.id !== id,
      ),
    })),
  clearNotifications: () => set({ notifications: [] }),
}));
