import { create } from 'zustand';
// import { persist } from 'zustand/middleware';
import type { NotificationStatus, NotificationAction } from '@/components/ui/notification-card';

export type Notification = {
  id: string;
  title: string;
  body: string;
  status: NotificationStatus;
  createdAt: string;
  actions?: NotificationAction[];
};

type NotificationState = {
  notifications: Notification[];
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  addNotification: (notification: Omit<Notification, 'status'>) => void;
  unreadCount: () => number;
};

// Notifications start empty and are populated by real product events through
// addNotification. Until an event source is wired up, the UI shows an honest
// empty state rather than placeholder data.
export const useNotificationStore = create<NotificationState>()(
  // To enable persistence across refreshes, uncomment the persist wrapper below:
  // persist(
  (set, get) => ({
    notifications: [],

    markAsRead: (id) =>
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, status: 'read' as const } : n
        )
      })),

    markAllAsRead: () =>
      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          status: 'read' as const
        }))
      })),

    removeNotification: (id) =>
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id)
      })),

    addNotification: (notification) =>
      set((state) => ({
        notifications: [{ ...notification, status: 'unread' as const }, ...state.notifications]
      })),

    unreadCount: () => get().notifications.filter((n) => n.status === 'unread').length
  })
  //   ,
  //   { name: 'notifications' }
  // )
);
