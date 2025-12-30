
import { Notification, NotificationType } from '../types';
import { NotificationManager } from './notificationManager';

class NotificationService {
  private notifications: Notification[] = [];
  private listeners: Array<(notifications: Notification[]) => void> = [];

  // Load notifications from localStorage
  loadNotifications(): Notification[] {
    try {
      const stored = localStorage.getItem('qpay_notifications');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.notifications = parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
          read: n.read || false
        }));
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
      this.notifications = [];
    }
    return this.notifications;
  }

  // Save notifications to localStorage
  private saveNotifications() {
    try {
      localStorage.setItem('qpay_notifications', JSON.stringify(this.notifications));
    } catch (error) {
      console.error('Failed to save notifications:', error);
    }
  }

  // Subscribe to notification changes
  subscribe(listener: (notifications: Notification[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners
  private notify() {
    this.listeners.forEach(listener => listener([...this.notifications]));
  }

  // Add a new notification (with browser notification support)
  add(type: NotificationType, title: string, message: string, showBrowserNotification: boolean = true): Notification {
    const notification: Notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      timestamp: new Date(),
      read: false
    };

    this.notifications.unshift(notification); // Add to beginning
    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }

    this.saveNotifications();
    this.notify();

    // Show browser notification if enabled
    if (showBrowserNotification && NotificationManager.getIsEnabled()) {
      if (type === 'success') {
        NotificationManager.showSyncNotification(message, 'success').catch(err => {
          console.error('Failed to show browser notification:', err);
        });
      } else if (type === 'error') {
        NotificationManager.showSyncNotification(message, 'error').catch(err => {
          console.error('Failed to show browser notification:', err);
        });
      } else {
        NotificationManager.showNotification(title, { body: message }).catch(err => {
          console.error('Failed to show browser notification:', err);
        });
      }
    }

    return notification;
  }

  // Mark notification as read
  markAsRead(id: string): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification && !notification.read) {
      notification.read = true;
      this.saveNotifications();
      this.notify();
    }
  }

  // Clear all notifications
  clearAll(): void {
    this.notifications = [];
    this.saveNotifications();
    this.notify();
  }

  // Get all notifications
  getAll(): Notification[] {
    return [...this.notifications];
  }

  // Get unread count
  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }
}

export const notificationService = new NotificationService();
