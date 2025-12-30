/**
 * Browser Notification Manager
 * Handles desktop/browser notifications outside of the app
 */

export class NotificationManager {
  private static permission: NotificationPermission = 'default';
  private static isEnabled: boolean = false;

  /**
   * Initialize notification manager
   */
  static async initialize(): Promise<boolean> {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications');
      return false;
    }

    // Load user preference
    const enabled = localStorage.getItem('qpay_notifications_enabled') === 'true';
    this.isEnabled = enabled;

    // Get current permission
    this.permission = Notification.permission;

    // If permission is granted and enabled, request notification permission
    if (this.permission === 'default' && enabled) {
      await this.requestPermission();
    }

    return this.isSupported();
  }

  /**
   * Check if notifications are supported
   */
  static isSupported(): boolean {
    return 'Notification' in window;
  }

  /**
   * Check if notifications are enabled
   */
  static getIsEnabled(): boolean {
    return this.isEnabled && this.permission === 'granted';
  }

  /**
   * Get current permission status
   */
  static getPermission(): NotificationPermission {
    return this.permission;
  }

  /**
   * Request notification permission
   */
  static async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      
      if (permission === 'granted') {
        this.isEnabled = true;
        localStorage.setItem('qpay_notifications_enabled', 'true');
      }
      
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Enable notifications
   */
  static async enable(): Promise<boolean> {
    if (this.permission === 'granted') {
      this.isEnabled = true;
      localStorage.setItem('qpay_notifications_enabled', 'true');
      return true;
    }

    if (this.permission === 'default') {
      const permission = await this.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  /**
   * Disable notifications
   */
  static disable(): void {
    this.isEnabled = false;
    localStorage.setItem('qpay_notifications_enabled', 'false');
  }

  /**
   * Show a browser notification
   */
  static async showNotification(
    title: string,
    options: NotificationOptions = {}
  ): Promise<Notification | null> {
    // Check if notifications are supported
    if (!this.isSupported()) {
      console.warn('Notifications not supported in this browser');
      return null;
    }

    // Update permission from browser
    this.permission = Notification.permission;

    // Check permission
    if (this.permission !== 'granted') {
      console.warn('Notification permission not granted. Current permission:', this.permission);
      return null;
    }

    try {
      const defaultOptions: NotificationOptions = {
        icon: '/logo.png',
        badge: '/logo.png',
        tag: `peymen-notification-${Date.now()}`,
        requireInteraction: false,
        silent: false,
        ...options
      };

      const notification = new Notification(title, defaultOptions);

      // Handle click
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }

  /**
   * Show transaction notification
   */
  static async showTransactionNotification(
    merchant: string,
    amount: number,
    type: 'DEBIT' | 'CREDIT'
  ): Promise<void> {
    const enabled = localStorage.getItem('qpay_transaction_notifications') !== 'false';
    if (!enabled || !this.getIsEnabled()) {
      return;
    }

    const emoji = type === 'DEBIT' ? '💸' : '💰';
    const title = `${emoji} ${type === 'DEBIT' ? 'Spent' : 'Received'}`;
    const body = `${type === 'DEBIT' ? '₹' : '+₹'}${amount.toLocaleString('en-IN')} at ${merchant}`;

    await this.showNotification(title, {
      body,
      tag: `transaction-${Date.now()}`,
      data: { type: 'transaction', merchant, amount, transactionType: type }
    });
  }

  /**
   * Show sync notification
   */
  static async showSyncNotification(
    message: string,
    type: 'success' | 'error' | 'info' = 'info'
  ): Promise<void> {
    const enabled = localStorage.getItem('qpay_sync_notifications') !== 'false';
    if (!enabled || !this.getIsEnabled()) {
      return;
    }

    const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    const title = `${emoji} Sync ${type === 'success' ? 'Completed' : type === 'error' ? 'Failed' : 'Update'}`;

    await this.showNotification(title, {
      body: message,
      tag: `sync-${Date.now()}`,
      data: { type: 'sync', syncType: type }
    });
  }

  /**
   * Show new transactions notification
   */
  static async showNewTransactionsNotification(count: number): Promise<void> {
    if (!this.getIsEnabled()) {
      return;
    }

    const title = '🆕 New Transactions';
    const body = count === 1 
      ? '1 new transaction detected'
      : `${count} new transactions detected`;

    await this.showNotification(title, {
      body,
      tag: 'new-transactions',
      data: { type: 'new-transactions', count }
    });
  }

  /**
   * Test notification
   */
  static async testNotification(): Promise<boolean> {
    console.log('[NotificationManager] Starting test notification...');
    
    // Check if notifications are supported
    if (!this.isSupported()) {
      const msg = 'Notifications are not supported in this browser.';
      console.error('[NotificationManager]', msg);
      alert(msg);
      return false;
    }
    console.log('[NotificationManager] ✅ Notifications API is supported');

    // Update permission from browser
    this.permission = Notification.permission;
    console.log('[NotificationManager] Current permission:', this.permission);

    // Check permission
    if (this.permission === 'default') {
      console.log('[NotificationManager] Permission is default, requesting...');
      const permission = await this.requestPermission();
      console.log('[NotificationManager] Permission result:', permission);
      
      if (permission !== 'granted') {
        const msg = 'Notification permission denied. Please enable it from your browser settings.';
        console.error('[NotificationManager]', msg);
        alert(msg);
        return false;
      }
    } else if (this.permission === 'denied') {
      const msg = 'Notification permission is denied. Please enable it from your browser settings:\n\nChrome: Settings > Privacy > Site Settings > Notifications\nFirefox: Settings > Privacy > Permissions > Notifications\nSafari: Preferences > Websites > Notifications';
      console.error('[NotificationManager]', msg);
      alert(msg);
      return false;
    }

    // Update permission state
    this.permission = Notification.permission;
    console.log('[NotificationManager] ✅ Permission granted, creating notification...');

    // Show test notification directly (bypass enabled check for testing)
    try {
      // Create notification options without icon first (to avoid icon loading errors)
      const notificationOptions: NotificationOptions = {
        body: 'Notifications are working correctly! You will receive notifications for new transactions and sync updates.',
        tag: `test-notification-${Date.now()}`,
        requireInteraction: true, // Keep visible until user interacts
        silent: false,
        dir: 'ltr',
        lang: 'en'
      };

      // Try to add icon if available (but don't fail if it's missing)
      try {
        // Check if icon exists by trying to fetch it
        const iconResponse = await fetch('/logo.png', { method: 'HEAD' });
        if (iconResponse.ok) {
          notificationOptions.icon = '/logo.png';
          notificationOptions.badge = '/logo.png';
          console.log('[NotificationManager] ✅ Icon found, adding to notification');
        } else {
          console.warn('[NotificationManager] ⚠️ Icon not found, creating notification without icon');
        }
      } catch (iconError) {
        console.warn('[NotificationManager] ⚠️ Could not check icon, creating notification without icon:', iconError);
      }

      console.log('[NotificationManager] Creating notification with options:', notificationOptions);
      const notification = new Notification('🔔 QPay Test Notification', notificationOptions);
      console.log('[NotificationManager] ✅ Notification created:', notification);

      // Handle show event
      notification.onshow = () => {
        console.log('[NotificationManager] 👁️ Notification shown on screen');
      };

      // Handle click
      notification.onclick = (event) => {
        console.log('[NotificationManager] 👆 Notification clicked');
        event.preventDefault();
        window.focus();
        // Don't close immediately, let user see it
      };

      // Handle close
      notification.onclose = () => {
        console.log('[NotificationManager] ❌ Notification closed');
      };

      // Handle error
      notification.onerror = (err) => {
        console.error('[NotificationManager] ❌ Notification error event:', err);
      };

      // Auto close after 10 seconds
      setTimeout(() => {
        console.log('[NotificationManager] ⏰ Auto-closing notification after 10 seconds');
        notification.close();
      }, 10000);

      // Show helpful message after a short delay
      setTimeout(() => {
        console.log('[NotificationManager] ✅ Test notification sent successfully');
        console.log('[NotificationManager] If notification is not visible, check:');
        console.log('[NotificationManager] 1. System notification center');
        console.log('[NotificationManager] 2. Browser notification settings');
        console.log('[NotificationManager] 3. OS "Do Not Disturb" mode');
        console.log('[NotificationManager] 4. Site notification permissions');
      }, 500);

      return true;
    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      console.error('[NotificationManager] ❌ Error creating notification:', error);
      console.error('[NotificationManager] Error details:', {
        name: error?.name,
        message: errorMsg,
        stack: error?.stack
      });
      
      const alertMsg = `Error showing notification: ${errorMsg}\n\nPlease check:\n1. Browser console (F12) for details\n2. Browser notification settings\n3. Make sure you are on HTTPS or localhost\n4. Check OS notification settings\n5. Try refreshing the page`;
      alert(alertMsg);
      return false;
    }
  }
}
