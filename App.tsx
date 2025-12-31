
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from './services/db';
import { AuthService } from './services/auth';
import { GmailService } from './services/gmail';
import { notificationService } from './services/notifications';
import { NotificationManager } from './services/notificationManager';
import { AutoSyncService } from './services/autoSync';
import { Transaction, UserProfile, TransactionType, SyncProgress } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import TransactionsList from './components/TransactionsList';
import Settings from './components/Settings';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import AddTransactionModal from './components/AddTransactionModal';
import SyncConfirmModal from './components/SyncConfirmModal';
import SyncProgressModal from './components/SyncProgressModal';
import TransactionDetailsModal from './components/TransactionDetailsModal';
import Onboarding from './components/Onboarding';
import LoginScreen from './components/LoginScreen';
import FirstTimeSyncModal from './components/FirstTimeSyncModal';
import InstallPromptModal from './components/InstallPromptModal';

const isDevelopment = (import.meta as any).env?.DEV;

const getDummyTransactions = (): Transaction[] => {
  if (!isDevelopment) return [];
  const now = new Date();
  return [
    { id: 'd1', date: now, amount: 824.00, currency: 'INR', merchant: 'Jenny Wilson', type: 'DEBIT', source: 'Visa ****4242', rawSnippet: 'Transfer', category: 'Shopping' },
    { id: 'd2', date: now, amount: 260.00, currency: 'INR', merchant: 'Albert Flores', type: 'CREDIT', source: 'UPI Payment', rawSnippet: 'Received', category: 'General' },
    { id: 'd3', date: new Date(now.getTime() - 86400000), amount: 1200.00, currency: 'INR', merchant: 'Employer Inc', type: 'CREDIT', source: 'Bank Transfer', rawSnippet: 'Salary credited', category: 'Income' },
    { id: 'd4', date: new Date(now.getTime() - 172800000), amount: 15.99, currency: 'INR', merchant: 'Netflix', type: 'DEBIT', source: 'Amex Platinum', rawSnippet: 'Subscription', category: 'Subscription' },
    { id: 'd5', date: new Date(now.getTime() - 259200000), amount: 89.00, currency: 'INR', merchant: 'Shell Petrol', type: 'DEBIT', source: 'Visa ****4242', rawSnippet: 'Fuel', category: 'Transport' },
    { id: 'd6', date: new Date(now.getTime() - 345600000), amount: 25.00, currency: 'INR', merchant: 'Swiggy', type: 'DEBIT', source: 'Mastercard ****1111', rawSnippet: 'Food delivery', category: 'Dining' },
    { id: 'd7', date: new Date(now.getTime() - 432000000), amount: 450.00, currency: 'INR', merchant: 'Apple Store', type: 'DEBIT', source: 'Amex Platinum', rawSnippet: 'Electronics', category: 'Shopping' },
    { id: 'd8', date: new Date(now.getTime() - 518400000), amount: 120.00, currency: 'INR', merchant: 'Amazon', type: 'DEBIT', source: 'Visa ****4242', rawSnippet: 'Purchase', category: 'Shopping' }
  ];
};

const App: React.FC = () => {
  // Enhanced session persistence with token validation
  const [token, setToken] = useState<string | null>(() => {
    const storedToken = localStorage.getItem('qpay_token');
    const tokenExpiry = localStorage.getItem('qpay_token_expiry');
    
    // Check if token exists and is not expired
    if (storedToken && tokenExpiry) {
      const expiryTime = parseInt(tokenExpiry);
      const currentTime = Date.now();
      
      // If token expires in next 5 minutes, consider it invalid
      if (currentTime < (expiryTime - 300000)) {
        console.log('✅ Valid session token found, maintaining login state');
        return storedToken;
      } else {
        console.log('⚠️ Token expired, clearing session');
        localStorage.removeItem('qpay_token');
        localStorage.removeItem('qpay_token_expiry');
        return null;
      }
    }
    
    return null;
  });

  // Security: Cleanup leaked API keys on startup
  useEffect(() => {
    const cleanupLeakedKeys = () => {
      const leakedKeys = [
        'AIzaSyAN1gbmoj37LUE0Wcrw3Km4c4MZuSrDaxs', // Reported as leaked in console logs
        'AIzaSyDCNNhW1--jdGKdAUpK_6BBkADIjs_jtPo'  // Previous leaked key from .env
      ];
      
      const storedKey = localStorage.getItem('qpay_gemini_key');
      const encryptedKey = localStorage.getItem('qpay_gemini_key_encrypted');
      
      let cleanupNeeded = false;
      
      if (storedKey && leakedKeys.includes(storedKey)) {
        console.log('🚨 SECURITY: Removing leaked API key from localStorage');
        localStorage.removeItem('qpay_gemini_key');
        cleanupNeeded = true;
      }
      
      if (encryptedKey) {
        // Try to decrypt and check (basic check)
        try {
          const decoded = atob(encryptedKey);
          if (leakedKeys.some(key => decoded.includes(key))) {
            console.log('🚨 SECURITY: Removing leaked encrypted API key from localStorage');
            localStorage.removeItem('qpay_gemini_key_encrypted');
            cleanupNeeded = true;
          }
        } catch (e) {
          // If decryption fails, remove the corrupted encrypted key
          console.log('🧹 Removing corrupted encrypted API key');
          localStorage.removeItem('qpay_gemini_key_encrypted');
          cleanupNeeded = true;
        }
      }
      
      if (cleanupNeeded) {
        setGeminiApiKey(''); // Clear from state
        notificationService.add(
          'warning',
          'Security Cleanup',
          '🔐 Removed leaked API key from storage. Please set a new Gemini API key in Settings for AI-powered transaction parsing.'
        );
      }
    };
    
    // Run cleanup on startup
    cleanupLeakedKeys();
    
    // Set up global notification function for GmailService
    (window as any).showLeakedKeyNotification = () => {
      notificationService.add(
        'error',
        'Leaked API Key Detected',
        '🚨 Your Gemini API key was reported as leaked and has been removed. Please generate a new key in Settings.'
      );
    };
    
    return () => {
      delete (window as any).showLeakedKeyNotification;
    };
  }, []);
  
  // Get Client ID with priority: env variable > localStorage
  const getClientId = (): string => {
    // Priority 1: Environment variable (.env or .env.local)
    const envClientId = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || 
                        (typeof process !== 'undefined' ? (process as any).env?.GOOGLE_CLIENT_ID : null);
    if (envClientId) {
      return envClientId;
    }
    
    // Priority 2: localStorage
    return localStorage.getItem('qpay_client_id') || '';
  };
  
  const [clientId, setClientId] = useState<string>(getClientId());
  const [user, setUser] = useState<UserProfile | null>(() => {
    // Restore user profile from localStorage if available
    const storedUser = localStorage.getItem('qpay_user_profile');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('✅ Restored user profile from storage');
        return parsedUser;
      } catch (error) {
        console.warn('Failed to parse stored user profile');
        localStorage.removeItem('qpay_user_profile');
      }
    }
    return null;
  });
  
  // Initialize activeTab from URL or default to dashboard
  const getInitialTab = (): string => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path === '/privacy') return 'privacy';
      if (path === '/terms') return 'terms';
    }
    return 'dashboard';
  };
  
  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({ status: 'idle', current: 0, total: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSyncConfirmOpen, setIsSyncConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [showDummyData, setShowDummyData] = useState<boolean>(() => {
    const saved = localStorage.getItem('qpay_show_dummy');
    const isGuestMode = localStorage.getItem('qpay_guest_mode') === 'true';
    const hasToken = localStorage.getItem('qpay_token');
    
    // Priority logic:
    // 1. If user has explicit preference, use it
    if (saved !== null) {
      return saved === 'true';
    }
    
    // 2. If user is logged in (has token), don't show dummy data
    if (hasToken) {
      return false;
    }
    
    // 3. If in guest mode, show dummy data
    if (isGuestMode) {
      return true;
    }
    
    // 4. Default: only show in development mode when not logged in
    return isDevelopment;
  });
  const [geminiApiKey, setGeminiApiKey] = useState<string>(localStorage.getItem('qpay_gemini_key') || '');
  
  // Onboarding & Login States
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean>(() => {
    return localStorage.getItem('qpay_has_seen_onboarding') === 'true';
  });
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [showLoginScreen, setShowLoginScreen] = useState<boolean>(false);
  const [isGuestMode, setIsGuestMode] = useState<boolean>(() => {
    return localStorage.getItem('qpay_guest_mode') === 'true';
  });
  const [showFirstTimeSyncModal, setShowFirstTimeSyncModal] = useState<boolean>(false);
  
  // PWA Install Prompt States
  const [showInstallPrompt, setShowInstallPrompt] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(() => {
    // Check if app is already installed
    if (typeof window !== 'undefined') {
      return window.matchMedia('(display-mode: standalone)').matches ||
             (window.navigator as any).standalone === true;
    }
    return false;
  });

  // Listen for beforeinstallprompt event and check install status
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      console.log('✅ Install prompt available');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('✅ App installed');
      setIsAppInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      notificationService.add(
        'success',
        'App Installed!',
        'Peymen has been installed successfully. You can now access it from your home screen.',
        true
      );
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if already installed on mount
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          (window.navigator as any).standalone === true;
      if (isStandalone) {
        setIsAppInstalled(true);
        console.log('✅ App already installed (standalone mode)');
      }
    };
    checkInstalled();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Check if user has dismissed install prompt before
  const hasDismissedInstallPrompt = () => {
    return localStorage.getItem('qpay_install_prompt_dismissed') === 'true';
  };

  const handleLogout = useCallback(() => {
    if (token) AuthService.logout(token);
    setToken(null);
    setUser(null);
    setIsGuestMode(false);
    localStorage.removeItem('qpay_guest_mode');
    localStorage.removeItem('qpay_user_profile'); // Clear persisted user profile
    
    // Reset dummy data to development default (only show in dev mode when not logged in)
    const shouldShowDummy = isDevelopment;
    setShowDummyData(shouldShowDummy);
    localStorage.setItem('qpay_show_dummy', shouldShowDummy.toString());
    
    // Show login screen after logout
    setShowLoginScreen(true);
  }, [token]);

  const fetchProfile = useCallback(async (accessToken: string) => {
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!res.ok) throw new Error("Session expired");
      const data = await res.json();
      const userProfile = { name: data.name, email: data.email, picture: data.picture };
      setUser(userProfile);
      
      // Persist user profile to localStorage for session restoration
      localStorage.setItem('qpay_user_profile', JSON.stringify(userProfile));
      console.log('✅ User profile saved to storage for session persistence');
      setError(null);
    } catch (err) {
      console.error('Profile fetch failed:', err);
      setError('Session expired. Please login again.');
      setTimeout(() => handleLogout(), 2000);
    }
  }, [handleLogout]);

  useEffect(() => {
    const checkSession = async () => {
      // Check if user is logged in or in guest mode
      if (isGuestMode) {
        // Guest mode - show dummy data
        setShowDummyData(true);
        return;
      }

      if (AuthService.isTokenValid() && token) {
        fetchProfile(token);
        // Hide dummy data when logged in with Google
        setShowDummyData(false);
        localStorage.setItem('qpay_show_dummy', 'false');
      } else {
        if (token) handleLogout();
      }
    };

    const currentClientId = clientId || getClientId();
    if (currentClientId && (window as any).google) {
      AuthService.initTokenClient(currentClientId, (resp) => {
        setToken(resp.access_token);
        fetchProfile(resp.access_token);
        // Hide dummy data when logged in
        setShowDummyData(false);
        localStorage.setItem('qpay_show_dummy', 'false');
      });
    }

    checkSession();
  }, [clientId, fetchProfile, token, handleLogout, isGuestMode]);

  // Auto-hide dummy data when user logs in
  useEffect(() => {
    if (user && !isGuestMode) {
      // User is logged in with Google - hide dummy data
      setShowDummyData(false);
      localStorage.setItem('qpay_show_dummy', 'false');
    } else if (isGuestMode) {
      // Guest mode - show dummy data
      setShowDummyData(true);
      localStorage.setItem('qpay_show_dummy', 'true');
    }
  }, [user, isGuestMode]);

  // Check if onboarding should be shown
  useEffect(() => {
    if (!user && !isGuestMode && !hasSeenOnboarding) {
      setShowOnboarding(true);
    } else if (!user && !isGuestMode && hasSeenOnboarding) {
      setShowLoginScreen(true);
    }
  }, [user, isGuestMode, hasSeenOnboarding]);

  // Initialize Service Worker and Notification Manager
  useEffect(() => {
    const initializeNotifications = async () => {
      // Initialize Notification Manager
      await NotificationManager.initialize();

      // Register Service Worker
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
          });
          console.log('Service Worker registered:', registration);

          // Start background sync if notifications are enabled
          if (NotificationManager.getIsEnabled()) {
            const syncInterval = localStorage.getItem('qpay_sync_interval');
            const interval = syncInterval ? parseInt(syncInterval) : 15 * 60 * 1000; // 15 minutes default
            
            if (registration.active) {
              registration.active.postMessage({
                type: 'START_SYNC',
                interval: interval
              });
            }
          }

          // Listen for messages from service worker
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'CHECK_TRANSACTIONS') {
              // Service worker is asking to check for new transactions
              // This will be handled by the auto-sync service
              console.log('Service Worker requested transaction check');
            }
          });
        } catch (error) {
          console.error('Service Worker registration failed:', error);
        }
      }
    };

    initializeNotifications();
  }, []);

  const loadFromDB = useCallback(async () => {
    const data = await db.transactions.orderBy('date').reverse().toArray();
    setTransactions(data);
  }, []);

  useEffect(() => { loadFromDB(); }, [loadFromDB]);

  const handleLogin = useCallback(() => {
    const currentClientId = clientId || getClientId();
    if (!currentClientId) {
      alert("Please provide a Google Client ID in Settings or set VITE_GOOGLE_CLIENT_ID in .env file.");
      setActiveTab('settings');
      return;
    }
    AuthService.login(currentClientId, async (resp) => {
      if (resp && resp.access_token) {
        setToken(resp.access_token);
        await fetchProfile(resp.access_token);
        
        // Check if user has any local data
        const localData = await db.transactions.count();
        
        // If no local data, show first-time sync modal
        if (localData === 0) {
          setShowFirstTimeSyncModal(true);
        }
        
        // Hide dummy data and guest mode
        setShowDummyData(false);
        setIsGuestMode(false);
        localStorage.setItem('qpay_show_dummy', 'false');
        localStorage.removeItem('qpay_guest_mode');
        setShowLoginScreen(false);

        // Show install prompt after successful login (if not already installed and not dismissed)
        // Always show if not installed (will show manual instructions if deferredPrompt not available)
        const checkIfInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                                 (window.navigator as any).standalone === true;
        const dismissed = localStorage.getItem('qpay_install_prompt_dismissed') === 'true';
        
        if (!checkIfInstalled && !dismissed) {
          // Small delay to let the UI settle after login
          setTimeout(() => {
            setShowInstallPrompt(true);
          }, 2000);
        }
      }
    });
  }, [clientId, fetchProfile, setActiveTab]);

  const handleGuestLogin = useCallback(() => {
    setIsGuestMode(true);
    setShowDummyData(true);
    localStorage.setItem('qpay_guest_mode', 'true');
    localStorage.setItem('qpay_show_dummy', 'true');
    setShowLoginScreen(false);
    setShowOnboarding(false);
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    setHasSeenOnboarding(true);
    localStorage.setItem('qpay_has_seen_onboarding', 'true');
    setShowOnboarding(false);
    setShowLoginScreen(true);
  }, []);

  const handleFirstTimeSync = useCallback(() => {
    setShowFirstTimeSyncModal(false);
    // Sync today's data
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    handleSync(1, undefined, startOfToday, endOfToday);
  }, []);

  const handleSkipFirstTimeSync = useCallback(() => {
    setShowFirstTimeSyncModal(false);
  }, []);

  const handleSyncClick = () => {
    const currentClientId = clientId || getClientId();
    if (!currentClientId) {
      alert('Please configure Google OAuth Client ID in Settings or set VITE_GOOGLE_CLIENT_ID in .env file.');
      return;
    }

    // Debug authentication state
    console.log('🔍 Debug: Authentication state before sync');
    console.log('- User state:', user ? 'SET' : 'NOT SET');
    console.log('- Token state:', token ? 'SET' : 'NOT SET');
    console.log('- Guest mode:', isGuestMode);
    console.log('- Stored token:', localStorage.getItem('qpay_token') ? 'EXISTS' : 'MISSING');
    console.log('- Token expiry:', localStorage.getItem('qpay_token_expiry'));

    if (!AuthService.isTokenValid()) {
      console.log('⚠️ AuthService says token is invalid');
      alert('Please login with Google to sync emails.');
      handleLogin();
      return;
    }

    // Check if token has Gmail scope
    if (!AuthService.hasGmailScope()) {
      console.log('⚠️ Token missing Gmail scope');
      notificationService.add(
        'warning',
        'Gmail Permission Required',
        'Your login doesn\'t include Gmail access. Please login again to grant Gmail permissions.'
      );
      setTimeout(() => {
        handleLogout();
        setTimeout(() => {
          handleLogin();
        }, 1000);
      }, 2000);
      return;
    }

    if (!token && !localStorage.getItem('qpay_token')) {
      console.log('⚠️ No token found in state or localStorage');
      alert('Please login with Google to sync emails.');
      handleLogin();
      return;
    }

    setIsSyncConfirmOpen(true);
  };

  const handleSync = useCallback(async (days: number = 30, syncType?: 'morning' | 'evening', customStartDate?: Date, customEndDate?: Date) => {
    if (!syncType) {
      setIsSyncConfirmOpen(false);
    }
    setIsSyncing(true);
    setSyncProgress({ status: 'fetching', current: 0, total: 0, saved: 0, message: syncType ? 'Auto-syncing...' : 'Connecting to Gmail...' });

    try {
      // ENHANCED TOKEN VALIDATION
      console.log('🔍 Validating access token...');
      
      // Get token from multiple sources with fallback
      let tokenToUse = token || localStorage.getItem('qpay_token');
      const tokenExpiry = localStorage.getItem('qpay_token_expiry');
      
      // Check if token exists first (primary validation)
      if (!tokenToUse || tokenToUse.trim() === '') {
        console.error('❌ No access token found in state or localStorage');
        // Clear any invalid token data
        localStorage.removeItem('qpay_token');
        localStorage.removeItem('qpay_token_expiry');
        setToken(null);
        throw new Error('GMAIL_AUTH_REQUIRED: No access token available. Please login again.');
      }
      
      // Check if user is logged in (but allow if we have a valid token)
      if (!user && !isGuestMode) {
        console.warn('⚠️ User state not set but token exists, attempting to fetch profile...');
        // Try to fetch profile with the token we have
        try {
          await fetchProfile(tokenToUse);
          console.log('✅ Successfully fetched user profile');
        } catch (profileError) {
          console.error('❌ Failed to fetch user profile:', profileError);
          throw new Error('GMAIL_AUTH_REQUIRED: Please login with Google to sync emails.');
        }
      }
      
      // Check token expiry (only if expiry info is available)
      if (tokenExpiry && tokenExpiry !== 'null' && tokenExpiry !== 'undefined') {
        try {
          const expiryTime = parseInt(tokenExpiry);
          const currentTime = Date.now();
          const timeUntilExpiry = expiryTime - currentTime;
          
          console.log(`⏰ Token expires in ${Math.round(timeUntilExpiry / 1000 / 60)} minutes`);
          
          // If token expires in less than 2 minutes, consider it expired
          if (timeUntilExpiry < 120000) {
            console.error('⏰ Access token has expired or will expire soon');
            // Clear expired token
            localStorage.removeItem('qpay_token');
            localStorage.removeItem('qpay_token_expiry');
            setToken(null);
            throw new Error('GMAIL_AUTH_EXPIRED: Your session has expired. Please login again.');
          }
        } catch (parseError) {
          console.warn('⚠️ Could not parse token expiry, proceeding with token validation');
        }
      } else {
        console.log('⚠️ No token expiry information available, skipping expiry check');
      }
      
      // Final validation: ensure token is a valid string
      if (typeof tokenToUse !== 'string' || tokenToUse.length < 10) {
        console.error('❌ Invalid token format');
        localStorage.removeItem('qpay_token');
        localStorage.removeItem('qpay_token_expiry');
        setToken(null);
        throw new Error('GMAIL_AUTH_REQUIRED: Invalid access token. Please login again.');
      }
      
      console.log('✅ Access token validation passed, proceeding with sync');
      const gmail = new GmailService(tokenToUse, geminiApiKey);

      // Calculate days based on sync type or custom date range
      let actualDays = days;
      let daysAgo: number;

      if (customStartDate && customEndDate) {
        // Custom date range: calculate from start date
        daysAgo = Math.floor(customStartDate.getTime() / 1000);
        // Calculate actual days for display purposes
        actualDays = Math.ceil((customEndDate.getTime() - customStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      } else if (syncType === 'morning') {
        // Morning sync: previous day + current day = 2 days
        actualDays = 2;
        daysAgo = Math.floor(Date.now() / 1000) - (actualDays * 24 * 60 * 60);
      } else if (syncType === 'evening') {
        // Evening sync: current day only = 1 day
        actualDays = 1;
        daysAgo = Math.floor(Date.now() / 1000) - (actualDays * 24 * 60 * 60);
      } else {
        // Manual sync: calculate from days parameter
        daysAgo = Math.floor(Date.now() / 1000) - (actualDays * 24 * 60 * 60);
      }
      
      // Use the enhanced Gmail query with OTP exclusion
      let query = 'subject:(transaction OR debit OR credit OR payment OR confirmed OR receipt OR "spent on" OR "charged" OR "UPI txn" OR "done a UPI" OR debited OR credited) OR from:(alerts@hdfcbank.net OR alerts@sbi.co.in OR alerts@icicibank.com OR alerts@axisbank.com)';
      
      if (customStartDate && customEndDate) {
        // Custom date range: use after and before
        const startTimestamp = Math.floor(customStartDate.getTime() / 1000);
        const endTimestamp = Math.floor(customEndDate.getTime() / 1000) + (24 * 60 * 60); // Include full end date
        query += ` after:${startTimestamp} before:${endTimestamp}`;
      } else {
        // Standard query: use days ago
        query += ` after:${daysAgo}`;
      }
      
      // Fetch up to 500 emails (Gmail API max per request)
      const messages = await gmail.listMessages(500, query);

      setSyncProgress({ status: 'processing', current: 0, total: messages.length, saved: 0, message: `Found ${messages.length} emails. Starting AI analysis...` });

      let count = 0;
      const BATCH_SIZE = 50; // Process in chunks of 50

      // Process messages in batches
      // Use bulk processing to reduce API calls (free tier optimization)
      const GEMINI_BATCH_SIZE = 10; // Process 10 emails per Gemini API call
      
      for (let i = 0; i < messages.length; i += BATCH_SIZE) {
        const batch = messages.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(messages.length / BATCH_SIZE);

        setSyncProgress(prev => ({
          ...prev,
          message: `Processing batch ${batchNum} of ${totalBatches}...`
        }));

        // Filter out existing transactions first
        const newMessages = [];
        for (const msg of batch) {
          count++;
          const existing = await db.transactions.get(msg.id);
          
          setSyncProgress(prev => ({
            ...prev,
            current: count,
            message: existing ? `Skipping existing (${count}/${messages.length})...` : `Queuing email ${count} of ${messages.length}...`
          }));

          if (!existing) {
            newMessages.push(msg);
          }
        }

        // Process new messages in bulk (10 at a time for Gemini API)
        if (newMessages.length > 0) {
          for (let j = 0; j < newMessages.length; j += GEMINI_BATCH_SIZE) {
            const geminiBatch = newMessages.slice(j, j + GEMINI_BATCH_SIZE);
            
            setSyncProgress(prev => ({
              ...prev,
              message: `Analyzing ${geminiBatch.length} emails with AI (${j + 1}-${Math.min(j + GEMINI_BATCH_SIZE, newMessages.length)} of ${newMessages.length} new)...`
            }));

            try {
              // Fetch full messages
              const fullMessages = await Promise.all(
                geminiBatch.map(msg => gmail.getMessage(msg.id))
              );

              // Bulk parse with single API call
              const parsedTransactions = await gmail.parseTransactionsBulk(fullMessages);

              // Save to database and track count
              let savedCount = 0;
              for (const parsed of parsedTransactions) {
                if (parsed) {
                  await db.transactions.add(parsed);
                  savedCount++;
                }
              }
              
              setSyncProgress(prev => ({
                ...prev,
                saved: (prev.saved || 0) + savedCount
              }));
            } catch (e) {
              console.error(`Failed to process Gemini batch`, e);
              
              // Fallback to basic parsing (NO additional API calls to save quota)
              setSyncProgress(prev => ({
                ...prev,
                message: `API quota issue - using basic parsing for ${geminiBatch.length} emails...`
              }));
              
              let savedCount = 0;
              for (const msg of geminiBatch) {
                try {
                  const fullMsg = await gmail.getMessage(msg.id);
                  // Use basic parsing without AI to save API quota
                  const parsed = await gmail.parseTransactionBasicOnly(fullMsg);
                  if (parsed) {
                    await db.transactions.add(parsed);
                    savedCount++;
                  }
                } catch (err) {
                  console.error(`Failed to process message ${msg.id}`, err);
                }
              }
              
              setSyncProgress(prev => ({
                ...prev,
                saved: (prev.saved || 0) + savedCount
              }));
            }

            // Delay between Gemini batches to respect rate limits
            if (j + GEMINI_BATCH_SIZE < newMessages.length) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        }

        // Small delay between batches to prevent rate limiting
        if (i + BATCH_SIZE < messages.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      await loadFromDB();
      
      // Get saved count from final progress state
      let finalSavedCount = 0;
      setSyncProgress(prev => {
        finalSavedCount = prev.saved || 0;
        return { 
          status: 'completed', 
          current: messages.length, 
          total: messages.length, 
          saved: finalSavedCount,
          message: `Successfully synced ${finalSavedCount} new transactions!` 
        };
      });

      // Add success notification (only if not auto-sync)
      if (!syncType) {
        if (finalSavedCount > 0) {
          notificationService.add(
            'success',
            'Sync Complete',
            `Successfully imported ${finalSavedCount} new payment${finalSavedCount > 1 ? 's' : ''} from Gmail.`
          );
        } else {
          notificationService.add(
            'info',
            'Sync Complete',
            'All payments are up to date. No new transactions found.'
          );
        }
      } else {
        // Auto-sync: silent notification
        if (finalSavedCount > 0) {
          notificationService.add(
            'success',
            `Auto-Sync ${syncType === 'morning' ? 'Morning' : 'Evening'} Complete`,
            `Synced ${finalSavedCount} new transaction${finalSavedCount > 1 ? 's' : ''} automatically.`
          );
        }
        // Update last sync time
        AutoSyncService.updateLastSync(syncType);
      }

    } catch (err) {
      console.error("Sync failed", err);

      // Handle specific error types
      let errorMessage = 'Sync failed. Please try again.';

      if (err instanceof Error) {
        if (err.message.includes('GMAIL_AUTH_REQUIRED')) {
          errorMessage = '🔐 Login Required: Please login with Google to sync your emails.';
          // Redirect to login
          setTimeout(() => handleLogin(), 1000);
        } else if (err.message.includes('GMAIL_AUTH_EXPIRED')) {
          errorMessage = '⏰ Session Expired: Your login session has expired. Please login again.';
          // Auto logout and redirect to login
          setTimeout(() => {
            handleLogout();
            handleLogin();
          }, 2000);
        } else if (err.message.includes('GMAIL_SCOPE_INSUFFICIENT')) {
          errorMessage = '🔐 Gmail Permission Required: Your login session doesn\'t have Gmail access. Clearing session and redirecting to login...';
          setActiveTab('settings');
          
          // COMPREHENSIVE CLEANUP for scope issues
          console.log('🧹 Performing comprehensive cleanup for Gmail scope issue...');
          
          // Clear all authentication-related localStorage
          localStorage.removeItem('qpay_token');
          localStorage.removeItem('qpay_token_expiry');
          localStorage.removeItem('qpay_token_scopes');
          localStorage.removeItem('qpay_user_profile');
          
          // Clear any cached OAuth state
          localStorage.removeItem('qpay_oauth_state');
          localStorage.removeItem('qpay_oauth_nonce');
          
          // Reset app state
          setToken(null);
          setUser(null);
          
          // Show a helpful notification
          notificationService.add(
            'warning',
            'Gmail Permission Required',
            'Your current login doesn\'t include Gmail access. All session data has been cleared. Please grant Gmail permissions when logging in again.'
          );
          
          // Auto-logout and redirect to login to get correct scopes
          setTimeout(() => {
            // Force a complete re-authentication with consent
            handleLogin();
          }, 3000);
        } else if (err.message.includes('GMAIL_PERMISSION_DENIED')) {
          errorMessage = '⚠️ Gmail Access Denied! Please add your email to Test Users in Google Cloud Console → OAuth Consent Screen.';
          setActiveTab('settings'); // Redirect to settings for help
        } else if (err.message.includes('GMAIL_AUTH_EXPIRED') || err.message.includes('401')) {
          errorMessage = 'Session expired. Please login again.';
          setTimeout(() => handleLogout(), 2000);
        } else if (err.message.includes('403') && !err.message.includes('GMAIL_SCOPE_INSUFFICIENT') && !err.message.includes('GMAIL_PERMISSION_DENIED')) {
          // Check if it's a Gemini API key issue
          if (err.message.includes('leaked') || err.message.includes('PERMISSION_DENIED')) {
            errorMessage = '🔑 Gemini API Key Issue: Your API key was reported as leaked or invalid. Please update it in Settings. Don\'t worry - basic parsing (without AI) is still working!';
            setActiveTab('settings');
          } else {
            // Generic 403 error - might be rate limiting or other API restrictions
            errorMessage = '⚠️ Gmail API Access Restricted: This might be due to rate limiting or API restrictions. Please try again later or check your Google Cloud Console settings.';
            setActiveTab('settings');
          }
        } else if (err.message.includes('Network')) {
          errorMessage = 'Network error. Please check your internet connection.';
        } else {
          errorMessage = `Error: ${err.message}`;
        }
      }

      setSyncProgress({ status: 'error', current: 0, total: 0, saved: 0, message: errorMessage });

      // Add error notification (only if not auto-sync)
      if (!syncType) {
        notificationService.add(
          'error',
          'Sync Failed',
          errorMessage
        );
      } else {
        // Auto-sync error: silent notification
        notificationService.add(
          'error',
          `Auto-Sync ${syncType === 'morning' ? 'Morning' : 'Evening'} Failed`,
          'Auto-sync encountered an error. Please sync manually.'
        );
      }
      } finally {
      if (syncType) {
        // Auto-sync: don't keep syncing state, just reset
        setIsSyncing(false);
        setSyncProgress({ status: 'idle', current: 0, total: 0, saved: 0 });
      }
    }
  }, [token, geminiApiKey, loadFromDB]);

  // Sync for today only - used by bottom nav cloud sync button (runs in background)
  const handleSyncToday = useCallback(async () => {
    // Don't start if already syncing
    if (isSyncing) {
      return;
    }

    const currentClientId = clientId || getClientId();
    if (!currentClientId) {
      notificationService.add(
        'error',
        'Configuration Required',
        'Please configure Google OAuth Client ID in Settings.'
      );
      setActiveTab('settings');
      return;
    }

    // Enhanced token validation for sync today
    const storedToken = localStorage.getItem('qpay_token');
    const tokenExpiry = localStorage.getItem('qpay_token_expiry');
    
    // Check if we have a token first (primary validation)
    if (!storedToken || storedToken.trim() === '') {
      console.log('🔍 No stored token found for sync today');
      
      // If user exists but no token, clear user state
      if (user) {
        console.log('🧹 Clearing user state due to missing token');
        handleLogout();
      }
      
      notificationService.add(
        'info',
        'Login Required',
        'Please login with Google to sync emails.'
      );
      handleLogin();
      return;
    }

    // Check token expiry if available
    if (tokenExpiry && tokenExpiry !== 'null' && tokenExpiry !== 'undefined') {
      try {
        const expiryTime = parseInt(tokenExpiry);
        const currentTime = Date.now();
        const timeUntilExpiry = expiryTime - currentTime;
        
        // If token expires in less than 5 minutes, refresh login
        if (timeUntilExpiry < 300000) {
          console.log('⏰ Token expires soon, requesting fresh login');
          
          if (user) {
            handleLogout();
          }
          
          notificationService.add(
            'info',
            'Session Refresh Required',
            'Your session will expire soon. Please login again.'
          );
          handleLogin();
          return;
        }
      } catch (parseError) {
        console.warn('⚠️ Could not parse token expiry for sync today');
      }
    }

    // Check if user state exists (but don't fail if token is valid)
    if (!user) {
      console.log('🔍 Token exists but user state missing, fetching profile');
      
      try {
        await fetchProfile(storedToken);
        console.log('✅ Successfully fetched user profile for sync today');
        // Continue with sync after profile is fetched
      } catch (err) {
        console.error('❌ Profile fetch failed during sync today:', err);
        // Profile fetch failed, need to login
        handleLogout();
        notificationService.add(
          'info',
          'Login Required',
          'Please login with Google to sync emails.'
        );
        handleLogin();
        return;
      }
    }

    // Sync for today only - set start and end to today
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    // Update token state if it's different
    if (storedToken !== token) {
      console.log('🔄 Updating token state to match localStorage');
      setToken(storedToken);
    }

    // Run sync in background (don't await, let it complete in background)
    handleSync(1, undefined, startOfToday, endOfToday).catch((error) => {
      console.error('Sync error:', error);
      
      // Handle specific sync errors
      if (error.message.includes('GMAIL_AUTH_REQUIRED') || error.message.includes('GMAIL_AUTH_EXPIRED')) {
        // Auth error - redirect to login
        handleLogout();
        setTimeout(() => handleLogin(), 1000);
      } else {
        notificationService.add(
          'error',
          'Sync Failed',
          'Failed to sync today\'s transactions. Please try again.'
        );
      }
    });
  }, [user, token, clientId, handleSync, isSyncing, handleLogin, handleLogout, fetchProfile, setActiveTab]);

  // Auto-sync setup
  useEffect(() => {
    const currentClientId = clientId || getClientId();
    if (!token || !AuthService.isTokenValid() || !currentClientId) {
      AutoSyncService.stop();
      return;
    }

    // Start auto-sync
    AutoSyncService.start(async (syncType: 'morning' | 'evening') => {
      await handleSync(30, syncType);
    });

    // Cleanup on unmount
    return () => {
      AutoSyncService.stop();
    };
  }, [token, geminiApiKey, handleSync, clientId]);

  const handleSyncModalClose = () => {
    setIsSyncing(false);
    setSyncProgress({ status: 'idle', current: 0, total: 0, saved: 0 });
  };

  const handleAddManualTransaction = async (data: any) => {
    const newTx: Transaction = {
      id: `man-${Date.now()}`,
      date: new Date(data.date),
      amount: parseFloat(data.amount),
      currency: 'INR',
      merchant: data.merchant,
      type: data.type as TransactionType,
      source: data.source || 'Manual Entry',
      rawSnippet: 'Manually added transaction',
      category: data.category
    };

    await db.transactions.add(newTx);
    await loadFromDB();
    setIsAddModalOpen(false);

    // Add success notification
    notificationService.add(
      'success',
      'Payment Added',
      `Successfully added payment of ₹${data.amount} to ${data.merchant}.`
    );
  };

  const handleClearData = async () => {
    if (window.confirm("Delete all locally stored transactions?")) {
      await db.transactions.clear();
      await loadFromDB();

      // Add info notification
      notificationService.add(
        'info',
        'Data Cleared',
        'All local payment data has been cleared. You can re-sync from Gmail anytime.'
      );
    }
  };

  const displayTransactions = useMemo<Transaction[]>(() => {
    const realTransactions = [...transactions];
    const dummyTransactions = showDummyData ? getDummyTransactions() : [];
    const merged = [...realTransactions, ...dummyTransactions];
    const sorted = merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (!searchQuery) return sorted;
    return sorted.filter(t =>
      t.merchant.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.source.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [transactions, searchQuery, showDummyData]);

  const handleToggleDummyData = (show: boolean) => {
    setShowDummyData(show);
    localStorage.setItem('qpay_show_dummy', show.toString());
  };

  const handleGeminiApiKeyChange = (newKey: string) => {
    if (!newKey.trim()) {
      // Clear key
      localStorage.removeItem('qpay_gemini_key_encrypted');
      localStorage.removeItem('qpay_gemini_key');
      setGeminiApiKey('');
      return;
    }

    // Check if it's a known leaked key
    const leakedKeys = [
      'AIzaSyAN1gbmoj37LUE0Wcrw3Km4c4MZuSrDaxs', // Reported as leaked in console logs
      'AIzaSyDCNNhW1--jdGKdAUpK_6BBkADIjs_jtPo'  // Previous leaked key from .env
    ];
    
    if (leakedKeys.includes(newKey)) {
      notificationService.add(
        'error',
        'Leaked API Key Detected',
        '🚨 This API key is on the leaked keys blacklist and cannot be used. Please generate a new key from Google AI Studio.'
      );
      return;
    }

    // Validate API key format
    if (!newKey.startsWith('AIza') || newKey.length !== 39) {
      notificationService.add(
        'error',
        'Invalid API Key',
        '❌ Invalid Gemini API key format. Keys should start with "AIza" and be 39 characters long.'
      );
      return;
    }

    // Use secure storage via GmailService
    const tempGmailService = new GmailService('temp', newKey);
    const success = (tempGmailService as any).setEncryptedApiKey(newKey);
    
    if (success) {
      setGeminiApiKey(newKey);
      notificationService.add(
        'success',
        'API Key Secured',
        '🔐 Gemini API key has been securely encrypted and stored! AI-powered transaction parsing is now enabled.'
      );
    } else {
      notificationService.add(
        'error',
        'Storage Failed',
        '❌ Failed to securely store API key. Please try again.'
      );
    }
  };

  // Handle URL-based routing
  useEffect(() => {
    const handleRouteChange = () => {
      if (typeof window === 'undefined') return;
      const path = window.location.pathname;
      if (path === '/privacy') {
        setActiveTab('privacy');
      } else if (path === '/terms') {
        setActiveTab('terms');
      } else if (path === '/') {
        // If on home, go to dashboard
        if (activeTab === 'privacy' || activeTab === 'terms') {
          setActiveTab('dashboard');
        }
      }
    };

    // Check initial route on mount
    handleRouteChange();

    // Listen for popstate (back/forward button) and hashchange
    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('hashchange', handleRouteChange);
    
    // Also check on interval to catch programmatic navigation
    const interval = setInterval(handleRouteChange, 100);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('hashchange', handleRouteChange);
      clearInterval(interval);
    };
  }, [activeTab]);

  // If on privacy route, render standalone Privacy Policy page (for direct URL access)
  if (typeof window !== 'undefined' && window.location.pathname === '/privacy') {
    return <PrivacyPolicy />;
  }

  // If on terms route, render standalone Terms of Service page (for direct URL access)
  if (typeof window !== 'undefined' && window.location.pathname === '/terms') {
    return <TermsOfService />;
  }

  // Show Onboarding if not seen and not logged in
  if (showOnboarding) {
    return <Onboarding onGetStarted={handleOnboardingComplete} />;
  }

  // Show Login Screen if not logged in and not in guest mode
  if (showLoginScreen && !user && !isGuestMode) {
    return (
      <>
        <LoginScreen 
          onGoogleLogin={handleLogin}
          onGuestLogin={handleGuestLogin}
          isLoading={isSyncing}
        />
      </>
    );
  }

  return (
    <Layout
      activeTab={activeTab} setActiveTab={setActiveTab} user={user} onLogout={handleLogout}
      onLogin={handleLogin}
      searchQuery={searchQuery} onSearchChange={setSearchQuery}
      onAddClick={() => setIsAddModalOpen(true)}
      onSync={handleSyncToday}
      isSyncing={isSyncing}
      transactions={displayTransactions}
    >
      {activeTab === 'dashboard' && (
        <Dashboard
          transactions={displayTransactions}
          onAddClick={() => setIsAddModalOpen(true)}
          isSyncing={isSyncing}
          syncProgress={syncProgress}
          onSync={handleSyncClick}
          onTransactionClick={(transaction) => {
            setSelectedTransaction(transaction);
            setIsDetailsModalOpen(true);
          }}
          onNavigateToTransactions={() => setActiveTab('transactions')}
          onNavigateToAnalytics={() => setActiveTab('analytics')}
        />
      )}

      {activeTab === 'transactions' && (
        <TransactionsList
          transactions={displayTransactions}
          onAddClick={() => setIsAddModalOpen(true)}
          onTransactionClick={(transaction) => {
            setSelectedTransaction(transaction);
            setIsDetailsModalOpen(true);
          }}
        />
      )}

      {activeTab === 'analytics' && (
        <Analytics 
          transactions={displayTransactions} 
          onShowDetails={(transaction) => {
            setSelectedTransaction(transaction);
            setIsDetailsModalOpen(true);
          }}
          onNavigateToTransactions={() => setActiveTab('transactions')}
        />
      )}

      {activeTab === 'settings' && (
        <Settings
          user={user}
          onLogout={handleLogout}
          onLogin={handleLogin}
          onSync={handleSyncClick}
          onOpenSyncModal={() => setIsSyncConfirmOpen(true)}
          isSyncing={isSyncing}
          syncProgress={syncProgress}
          clientId={clientId}
          onClientIdChange={(id) => {
            setClientId(id);
            // Only save to localStorage if not using env variable
            if (!(import.meta as any).env?.VITE_GOOGLE_CLIENT_ID && 
                !(typeof process !== 'undefined' ? (process as any).env?.GOOGLE_CLIENT_ID : null)) {
              localStorage.setItem('qpay_client_id', id);
            }
            AuthService.initTokenClient(id, (resp) => {
              setToken(resp.access_token);
              fetchProfile(resp.access_token);
            });
          }}
          onClearData={handleClearData}
          showDummyData={showDummyData}
          onToggleDummyData={handleToggleDummyData}
          geminiApiKey={geminiApiKey}
          onGeminiApiKeyChange={handleGeminiApiKeyChange}
          onPrivacyPolicyClick={() => setActiveTab('privacy')}
          onShowInstallPrompt={() => {
            // Clear dismissed flag to allow showing again
            localStorage.removeItem('qpay_install_prompt_dismissed');
            setShowInstallPrompt(true);
          }}
          deferredPrompt={deferredPrompt}
        />
      )}

      {activeTab === 'privacy' && <PrivacyPolicy />}

      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddManualTransaction}
      />

      <SyncConfirmModal
        isOpen={isSyncConfirmOpen}
        onClose={() => setIsSyncConfirmOpen(false)}
        onConfirm={(days, customStartDate, customEndDate) => handleSync(days, undefined, customStartDate, customEndDate)}
        isProcessing={isSyncing}
      />

      <SyncProgressModal
        isOpen={isSyncing}
        progress={syncProgress}
        onClose={handleSyncModalClose}
      />

      <TransactionDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedTransaction(null);
        }}
        transaction={selectedTransaction}
      />

      <FirstTimeSyncModal
        isOpen={showFirstTimeSyncModal}
        onClose={handleSkipFirstTimeSync}
        onSync={handleFirstTimeSync}
        onSkip={handleSkipFirstTimeSync}
      />

      <InstallPromptModal
        isOpen={showInstallPrompt}
        onClose={() => {
          setShowInstallPrompt(false);
          localStorage.setItem('qpay_install_prompt_dismissed', 'true');
        }}
        onInstall={() => {
          setShowInstallPrompt(false);
          setIsAppInstalled(true);
        }}
        deferredPrompt={deferredPrompt}
      />
    </Layout>
  );
};

export default App;
