
export interface AutoSyncSettings {
  enabled: boolean;
  morningTime: string; // Format: "HH:mm" (e.g., "07:00")
  eveningTime: string; // Format: "HH:mm" (e.g., "19:00")
  lastMorningSync?: Date;
  lastEveningSync?: Date;
}

const DEFAULT_MORNING_TIME = "07:00";
const DEFAULT_EVENING_TIME = "19:00";

export class AutoSyncService {
  private static checkInterval: number | null = null;
  private static syncCallback: ((syncType: 'morning' | 'evening') => Promise<void>) | null = null;

  /**
   * Load auto-sync settings from localStorage
   */
  static loadSettings(): AutoSyncSettings {
    const saved = localStorage.getItem('qpay_auto_sync_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          enabled: parsed.enabled ?? true,
          morningTime: parsed.morningTime || DEFAULT_MORNING_TIME,
          eveningTime: parsed.eveningTime || DEFAULT_EVENING_TIME,
          lastMorningSync: parsed.lastMorningSync ? new Date(parsed.lastMorningSync) : undefined,
          lastEveningSync: parsed.lastEveningSync ? new Date(parsed.lastEveningSync) : undefined,
        };
      } catch (e) {
        console.error('Failed to parse auto-sync settings', e);
      }
    }
    
    return {
      enabled: true,
      morningTime: DEFAULT_MORNING_TIME,
      eveningTime: DEFAULT_EVENING_TIME,
    };
  }

  /**
   * Save auto-sync settings to localStorage
   */
  static saveSettings(settings: AutoSyncSettings): void {
    localStorage.setItem('qpay_auto_sync_settings', JSON.stringify(settings));
  }

  /**
   * Update last sync time
   */
  static updateLastSync(syncType: 'morning' | 'evening'): void {
    const settings = this.loadSettings();
    if (syncType === 'morning') {
      settings.lastMorningSync = new Date();
    } else {
      settings.lastEveningSync = new Date();
    }
    this.saveSettings(settings);
  }

  /**
   * Parse time string (HH:mm) to hours and minutes
   */
  private static parseTime(timeStr: string): { hours: number; minutes: number } {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return { hours, minutes };
  }

  /**
   * Check if it's time for morning sync
   * Morning sync: previous day + current day
   */
  private static shouldRunMorningSync(settings: AutoSyncSettings): boolean {
    if (!settings.enabled) return false;

    const now = new Date();
    const { hours, minutes } = this.parseTime(settings.morningTime);
    
    // Check if current time matches morning sync time (within 1 minute window)
    const isTimeMatch = now.getHours() === hours && now.getMinutes() === minutes;
    
    if (!isTimeMatch) return false;

    // Check if we already synced today at this time
    if (settings.lastMorningSync) {
      const lastSync = new Date(settings.lastMorningSync);
      const today = new Date();
      
      // Same day and same hour - already synced
      if (
        lastSync.getDate() === today.getDate() &&
        lastSync.getMonth() === today.getMonth() &&
        lastSync.getFullYear() === today.getFullYear() &&
        lastSync.getHours() === hours
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if it's time for evening sync
   * Evening sync: current day only
   */
  private static shouldRunEveningSync(settings: AutoSyncSettings): boolean {
    if (!settings.enabled) return false;

    const now = new Date();
    const { hours, minutes } = this.parseTime(settings.eveningTime);
    
    // Check if current time matches evening sync time (within 1 minute window)
    const isTimeMatch = now.getHours() === hours && now.getMinutes() === minutes;
    
    if (!isTimeMatch) return false;

    // Check if we already synced today at this time
    if (settings.lastEveningSync) {
      const lastSync = new Date(settings.lastEveningSync);
      const today = new Date();
      
      // Same day and same hour - already synced
      if (
        lastSync.getDate() === today.getDate() &&
        lastSync.getMonth() === today.getMonth() &&
        lastSync.getFullYear() === today.getFullYear() &&
        lastSync.getHours() === hours
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Start auto-sync scheduler
   */
  static start(callback: (syncType: 'morning' | 'evening') => Promise<void>): void {
    this.syncCallback = callback;
    
    // Clear existing interval if any
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Check every minute
    this.checkInterval = window.setInterval(() => {
      const settings = this.loadSettings();
      
      if (!settings.enabled) return;

      // Check morning sync
      if (this.shouldRunMorningSync(settings)) {
        console.log('Auto-sync: Running morning sync (previous day + today)');
        callback('morning').catch(err => {
          console.error('Auto-sync morning failed:', err);
        });
      }

      // Check evening sync
      if (this.shouldRunEveningSync(settings)) {
        console.log('Auto-sync: Running evening sync (today only)');
        callback('evening').catch(err => {
          console.error('Auto-sync evening failed:', err);
        });
      }
    }, 60000); // Check every minute
  }

  /**
   * Stop auto-sync scheduler
   */
  static stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.syncCallback = null;
  }

  /**
   * Get next sync time information
   */
  static getNextSyncInfo(): { nextMorning: Date | null; nextEvening: Date | null } {
    const settings = this.loadSettings();
    if (!settings.enabled) {
      return { nextMorning: null, nextEvening: null };
    }

    const now = new Date();
    const { hours: morningHours, minutes: morningMinutes } = this.parseTime(settings.morningTime);
    const { hours: eveningHours, minutes: eveningMinutes } = this.parseTime(settings.eveningTime);

    // Calculate next morning sync
    const nextMorning = new Date();
    nextMorning.setHours(morningHours, morningMinutes, 0, 0);
    if (nextMorning <= now) {
      nextMorning.setDate(nextMorning.getDate() + 1);
    }

    // Calculate next evening sync
    const nextEvening = new Date();
    nextEvening.setHours(eveningHours, eveningMinutes, 0, 0);
    if (nextEvening <= now) {
      nextEvening.setDate(nextEvening.getDate() + 1);
    }

    return { nextMorning, nextEvening };
  }
}
