
/**
 * Type of financial transaction
 */
export type TransactionType = 'DEBIT' | 'CREDIT' | 'TRANSFER';

/**
 * Transaction categories for classification
 * Transport, Subscription, Dining, Shopping, Groceries, Health, 
 * Utilities, Travel, Education, Entertainment, Income, Investment, General
 */
export type TransactionCategory = 
  | 'Transport' 
  | 'Subscription' 
  | 'Dining' 
  | 'Shopping' 
  | 'Groceries'
  | 'Health' 
  | 'Utilities' 
  | 'Travel' 
  | 'Education'
  | 'Entertainment'
  | 'Income'
  | 'Investment'
  | 'General';

/**
 * Represents a financial transaction
 */
export interface Transaction {
  /** Unique identifier (Gmail message ID) */
  id: string;
  /** Transaction date */
  date: Date;
  /** Transaction amount */
  amount: number;
  /** Currency code (USD, INR, EUR, GBP, etc.) */
  currency: string;
  /** Merchant or recipient name */
  merchant: string;
  /** Transaction type */
  type: TransactionType;
  /** Payment source (e.g., "HDFC Visa ****1234", "PhonePe UPI") */
  source: string;
  /** Raw email snippet for reference */
  rawSnippet: string;
  /** Transaction category */
  category: string;
}

/**
 * User profile information from Google OAuth
 */
export interface UserProfile {
  /** User's full name */
  name: string;
  /** User's email address */
  email: string;
  /** Profile picture URL */
  picture: string;
}

/**
 * Statistics for sync operations
 */
export interface SyncStats {
  /** Last successful sync timestamp */
  lastSync: Date | null;
  /** Number of emails processed */
  emailsProcessed: number;
  /** Total transactions synced */
  totalTransactions: number;
}

/**
 * Real-time sync progress tracking
 */
export interface SyncProgress {
  /** Current sync status */
  status: 'idle' | 'fetching' | 'processing' | 'completed' | 'error';
  /** Current progress count */
  current: number;
  /** Total items to process */
  total: number;
  /** Number of new transactions saved */
  saved?: number;
  /** Optional progress message */
  message?: string;
}

/**
 * Notification types
 */
export type NotificationType = 'success' | 'info' | 'warning' | 'error';

/**
 * Represents a notification
 */
export interface Notification {
  /** Unique identifier */
  id: string;
  /** Notification type */
  type: NotificationType;
  /** Notification title */
  title: string;
  /** Notification message */
  message: string;
  /** Timestamp when notification was created */
  timestamp: Date;
  /** Whether notification has been read */
  read: boolean;
}
