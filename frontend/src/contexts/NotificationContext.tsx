import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationSettings {
  enabled: boolean;
  reminderTime: number; // minutes before appointment
  reminderCount: number; // number of reminders (1, 2, or 3)
}

const defaultSettings: NotificationSettings = {
  enabled: true,
  reminderTime: 15,
  reminderCount: 1,
};

interface NotificationContextType {
  settings: NotificationSettings;
  updateSettings: (newSettings: Partial<NotificationSettings>) => Promise<void>;
  scheduleAppointmentReminder: (
    appointmentId: string,
    title: string,
    dateTime: Date
  ) => Promise<void>;
  cancelAppointmentReminder: (appointmentId: string) => Promise<void>;
  requestPermissions: () => Promise<boolean>;
  hasPermission: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [hasPermission, setHasPermission] = useState(false);
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    loadSettings();
    checkPermissions();

    // Add notification listeners
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem('notification_settings');
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const checkPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const requestPermissions = async (): Promise<boolean> => {
    const { status } = await Notifications.requestPermissionsAsync();
    const granted = status === 'granted';
    setHasPermission(granted);
    return granted;
  };

  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    const updated = { ...settings, ...newSettings };
    try {
      await AsyncStorage.setItem('notification_settings', JSON.stringify(updated));
      setSettings(updated);
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  };

  const scheduleAppointmentReminder = async (
    appointmentId: string,
    title: string,
    dateTime: Date
  ) => {
    if (!settings.enabled || !hasPermission) return;

    // Cancel any existing reminders for this appointment
    await cancelAppointmentReminder(appointmentId);

    const now = new Date();
    const reminderTimes = [];

    // Calculate reminder times based on settings
    for (let i = 0; i < settings.reminderCount; i++) {
      const reminderOffset = settings.reminderTime * (i + 1); // 15, 30, 45 minutes, etc.
      const reminderDate = new Date(dateTime.getTime() - reminderOffset * 60 * 1000);
      
      if (reminderDate > now) {
        reminderTimes.push({ date: reminderDate, offset: reminderOffset });
      }
    }

    // Schedule each reminder
    for (const reminder of reminderTimes) {
      const identifier = `${appointmentId}_${reminder.offset}`;
      
      await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
          title: '📅 Recordatorio de Cita',
          body: `${title} - en ${reminder.offset} minutos`,
          data: { appointmentId },
          sound: true,
        },
        trigger: {
          date: reminder.date,
        },
      });
    }
  };

  const cancelAppointmentReminder = async (appointmentId: string) => {
    // Get all scheduled notifications
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    
    // Cancel notifications for this appointment
    for (const notification of scheduled) {
      if (notification.identifier.startsWith(appointmentId)) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        settings,
        updateSettings,
        scheduleAppointmentReminder,
        cancelAppointmentReminder,
        requestPermissions,
        hasPermission,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
