import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppNotification } from '../types';
import { storage } from '../lib/storage';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  sendNotification: (notif: Omit<AppNotification, 'id' | 'created_at' | 'read'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    return storage.getNotifications();
  });

  useEffect(() => {
    // Reload notifications from storage
    setNotifications(storage.getNotifications());
  }, [user]);

  const userNotifications = notifications.filter(
    n => !user || n.user_id === user.id || n.user_id === 'all'
  );

  const unreadCount = userNotifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    storage.markNotificationAsRead(id);
    setNotifications(storage.getNotifications());
  };

  const markAllAsRead = () => {
    storage.markAllNotificationsAsRead(user?.id);
    setNotifications(storage.getNotifications());
  };

  const sendNotification = (notifData: Omit<AppNotification, 'id' | 'created_at' | 'read'>) => {
    const newNotif: AppNotification = {
      ...notifData,
      id: 'notif-' + Date.now(),
      read: false,
      created_at: new Date().toISOString(),
    };
    storage.addNotification(newNotif);
    setNotifications(storage.getNotifications());
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications: userNotifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        sendNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
