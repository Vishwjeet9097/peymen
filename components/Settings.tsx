
import React, { useState, useEffect } from 'react';
import { NotificationManager } from '../services/notificationManager';
import { Shield, RefreshCw, Key, LogOut, Info, Trash2, UserCheck, LogIn, AlertCircle, CheckCircle2, Copy, ExternalLink, HelpCircle, AlertTriangle, Eye, EyeOff, Sparkles, User, Mail, Calendar, Clock, Bell, BellOff, BellRing, FileText } from 'lucide-react';
import { SyncProgress } from '../types';
import { AutoSyncService, AutoSyncSettings } from '../services/autoSync';
import TimePicker from './TimePicker';

interface SettingsProps {
  user: any;
  onLogout: () => void;
  onLogin: () => void;
  onSync: (days?: number) => void;
  onOpenSyncModal?: () => void;
  isSyncing: boolean;
  syncProgress?: SyncProgress;
  clientId: string;
  onClientIdChange: (id: string) => void;
  onClearData: () => void;
  showDummyData: boolean;
  onToggleDummyData: (show: boolean) => void;
  geminiApiKey: string;
  onGeminiApiKeyChange: (key: string) => void;
  onPrivacyPolicyClick?: () => void;
}

const Settings: React.FC<SettingsProps> = ({
  user,
  onLogout,
  onLogin,
  onSync,
  onOpenSyncModal,
  isSyncing,
  syncProgress,
  clientId,
  onClientIdChange,
  onClearData,
  showDummyData,
  onToggleDummyData,
  geminiApiKey,
  onGeminiApiKeyChange,
  onPrivacyPolicyClick
}) => {
  const [showSetupHelper, setShowSetupHelper] = useState(false);
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const hasEnvApiKey = !!((import.meta as any).env?.VITE_GEMINI_API_KEY);
  
  // Auto-sync settings
  const [autoSyncSettings, setAutoSyncSettings] = useState<AutoSyncSettings>(() => AutoSyncService.loadSettings());
  const [nextSyncInfo, setNextSyncInfo] = useState<{ nextMorning: Date | null; nextEvening: Date | null }>({ nextMorning: null, nextEvening: null });

  // Notification settings
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    return NotificationManager.getIsEnabled();
  });
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    return NotificationManager.getPermission();
  });
  const [transactionNotifications, setTransactionNotifications] = useState<boolean>(() => {
    return localStorage.getItem('qpay_transaction_notifications') !== 'false';
  });
  const [syncNotifications, setSyncNotifications] = useState<boolean>(() => {
    return localStorage.getItem('qpay_sync_notifications') !== 'false';
  });
  const [individualTransactionNotifications, setIndividualTransactionNotifications] = useState<boolean>(() => {
    return localStorage.getItem('qpay_individual_transaction_notifications') === 'true';
  });

  // Initialize notification manager
  useEffect(() => {
    NotificationManager.initialize().then(() => {
      setNotificationsEnabled(NotificationManager.getIsEnabled());
      setNotificationPermission(NotificationManager.getPermission());
    });
  }, []);

  // Update next sync info when settings change
  useEffect(() => {
    setNextSyncInfo(AutoSyncService.getNextSyncInfo());
    const interval = setInterval(() => {
      setNextSyncInfo(AutoSyncService.getNextSyncInfo());
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [autoSyncSettings]);

  const handleAutoSyncToggle = (enabled: boolean) => {
    const newSettings = { ...autoSyncSettings, enabled };
    setAutoSyncSettings(newSettings);
    AutoSyncService.saveSettings(newSettings);
  };

  const handleTimeChange = (type: 'morning' | 'evening', time: string) => {
    const newSettings = { ...autoSyncSettings };
    if (type === 'morning') {
      newSettings.morningTime = time;
    } else {
      newSettings.eveningTime = time;
    }
    setAutoSyncSettings(newSettings);
    AutoSyncService.saveSettings(newSettings);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleSyncClick = () => {
    if (onOpenSyncModal) {
      onOpenSyncModal();
    } else {
      // Fallback to default 30 days if modal not available
      onSync(30);
    }
  };

  return (
    <div className="max-w-6xl space-y-4 md:space-y-6 lg:space-y-8 animate-slide-up pb-6 md:pb-10">
      {/* Profile Section - Hero - Enhanced for Mobile */}
      {user ? (
        <div className="glass-card overflow-hidden relative">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-10" />

          <div className="relative p-4 md:p-8 lg:p-12">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 lg:gap-8">
              {/* Avatar */}
              <div className="relative mx-auto md:mx-0">
                <div className="w-20 h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 rounded-2xl md:rounded-[2rem] overflow-hidden shadow-2xl border-3 md:border-4 border-white">
                  <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
                </div>
                <div className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 w-6 h-6 md:w-8 md:h-8 bg-emerald-500 rounded-lg md:rounded-xl flex items-center justify-center border-2 md:border-4 border-white shadow-lg">
                  <CheckCircle2 size={12} className="md:w-4 md:h-4 text-white" />
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1 w-full text-center md:text-left">
                <div className="flex flex-col md:flex-row items-center md:items-center gap-2 md:gap-3 mb-2">
                  <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-slate-900">{user.name}</h2>
                  <span className="px-2.5 md:px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-wider border border-emerald-200">
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2 text-slate-600 mb-3 md:mb-4">
                  <Mail size={12} className="md:w-3.5 md:h-3.5" />
                  <p className="text-xs md:text-sm font-bold truncate max-w-full">{user.email}</p>
                </div>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-3">
                  <div className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1 md:py-1.5 bg-white rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-bold text-slate-600 border border-slate-100">
                    <UserCheck size={10} className="md:w-3 md:h-3 text-emerald-500" />
                    Authenticated
                  </div>
                  <div className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1 md:py-1.5 bg-white rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-bold text-slate-600 border border-slate-100">
                    <Shield size={10} className="md:w-3 md:h-3 text-indigo-500" />
                    Secure Session
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="w-full md:w-auto px-5 md:px-6 py-2.5 md:py-3 bg-slate-900 text-white rounded-xl md:rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <LogOut size={14} className="md:w-4 md:h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-card p-6 md:p-8 lg:p-12 text-center">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-100 rounded-full mx-auto mb-4 md:mb-6 flex items-center justify-center">
            <User size={24} className="md:w-8 md:h-8 text-slate-400" />
          </div>
          <h3 className="text-xl md:text-2xl font-black text-slate-800 mb-2 md:mb-3">Welcome to Peymen</h3>
          <p className="text-xs md:text-sm font-medium text-slate-500 mb-4 md:mb-6 px-4">Connect your Google account to start syncing transactions</p>
          <button
            onClick={onLogin}
            className="px-6 md:px-8 py-3 md:py-4 bg-indigo-600 text-white rounded-xl md:rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2 mx-auto"
          >
            <LogIn size={16} className="md:w-4.5 md:h-4.5" />
            Connect Google Account
          </button>
        </div>
      )}

      {/* Setup Helper - Mobile Optimized */}
      <button
        onClick={() => setShowSetupHelper(!showSetupHelper)}
        className={`w-full flex items-center justify-between p-3 md:p-4 rounded-xl md:rounded-2xl border-2 transition-all ${showSetupHelper ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200 hover:border-amber-200'}`}
      >
        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
          <AlertTriangle size={18} className="md:w-5 md:h-5 text-amber-600 shrink-0" />
          <span className="text-xs md:text-sm font-black text-slate-800 truncate">Troubleshoot Gmail Access Issues</span>
        </div>
        <span className="text-[9px] md:text-[10px] font-black text-amber-600 uppercase shrink-0 ml-2">{showSetupHelper ? 'Hide' : 'Show'} Help</span>
      </button>

      {showSetupHelper && (
        <div className="glass-card p-8 bg-amber-50 border-amber-200 space-y-6 animate-slide-up">
          <div className="flex items-center gap-3 text-amber-700">
            <AlertCircle size={24} />
            <h3 className="font-black uppercase tracking-tight">Resolve "Access Blocked: Authorization Error"</h3>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-amber-100 space-y-4">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Step 1: Whitelist Origin</h4>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                Copy this URL and add it to <b>"Authorized JavaScript origins"</b> in your Google Cloud Console Credentials.
              </p>
              <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <code className="text-xs font-bold text-indigo-600 flex-1 truncate">{currentOrigin}</code>
                <button onClick={() => copyToClipboard(currentOrigin)} className="p-2 hover:bg-white hover:shadow-sm rounded-lg text-slate-400 transition-all"><Copy size={14} /></button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-amber-100 space-y-4">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest text-rose-600">Step 2: Restricted Scope (CRITICAL)</h4>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                Because this app requests <b>Gmail Read-Only</b> access, Google will block it unless:
              </p>
              <ul className="list-disc list-inside text-sm text-slate-600 font-medium space-y-2 ml-2">
                <li>Your app is <b>Verified</b> (takes weeks) <b>OR</b></li>
                <li>You add your email to the <b>"Test Users"</b> list.</li>
              </ul>
              <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
                <p className="text-[11px] font-bold text-rose-700">
                  Go to <b>OAuth Consent Screen</b> &rarr; <b>Test Users</b> &rarr; Click <b>"+ Add Users"</b> and enter your email address.
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all"
              >
                Open Google Cloud Console <ExternalLink size={14} />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Gmail Sync & Configuration Grid - Mobile Optimized */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Gmail OAuth Configuration */}
        <div className="glass-card p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
          <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-50 text-indigo-600 rounded-lg md:rounded-xl flex items-center justify-center">
              <Key size={18} className="md:w-5 md:h-5" />
            </div>
            <h3 className="text-sm md:text-base font-extrabold text-slate-800 uppercase tracking-tighter">OAuth Config</h3>
          </div>

          <div className="space-y-5">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block flex items-center gap-2">
                Google Client ID
                {((import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || 
                  (typeof process !== 'undefined' ? (process as any).env?.GOOGLE_CLIENT_ID : null)) && (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-md text-[8px] font-bold">
                    Using .env
                  </span>
                )}
              </label>
              <form onSubmit={(e) => e.preventDefault()} className="relative">
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder={
                    ((import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || 
                     (typeof process !== 'undefined' ? (process as any).env?.GOOGLE_CLIENT_ID : null))
                      ? "Using environment variable (VITE_GOOGLE_CLIENT_ID)"
                      : "Paste your OAuth Client ID or set VITE_GOOGLE_CLIENT_ID in .env"
                  }
                  value={clientId}
                  onChange={(e) => onClientIdChange(e.target.value)}
                  disabled={!!((import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || 
                              (typeof process !== 'undefined' ? (process as any).env?.GOOGLE_CLIENT_ID : null))}
                  className={`w-full bg-slate-50 border-none rounded-2xl h-12 px-4 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-100 transition-all ${
                    ((import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || 
                     (typeof process !== 'undefined' ? (process as any).env?.GOOGLE_CLIENT_ID : null))
                      ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                />
              </form>
              <p className="text-[9px] font-bold text-slate-400 mt-2 leading-relaxed">
                {((import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || 
                  (typeof process !== 'undefined' ? (process as any).env?.GOOGLE_CLIENT_ID : null))
                  ? "Priority: Environment variable (.env) is being used. Settings value is ignored."
                  : "Set VITE_GOOGLE_CLIENT_ID in .env or .env.local file for automatic loading."}
              </p>
            </div>

            {!user ? (
              <button
                onClick={onLogin}
                className="w-full h-14 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                <LogIn size={18} />
                Login with Google
              </button>
            ) : null}
          </div>
        </div>

        {/* Gmail Sync with 90 Days Option - Enhanced */}
        <div className="lg:col-span-2 glass-card p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 relative overflow-hidden">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-primary)]/5 via-[var(--brand-accent)]/5 to-[var(--brand-blue)]/5 pointer-events-none" />
          
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[var(--brand-primary)]/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-[var(--brand-accent)]/10 to-transparent rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

          <div className="relative z-10">
            {/* Enhanced Header */}
            <div className="flex items-center gap-3 md:gap-4 mb-6 md:mb-8">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-accent)] rounded-2xl flex items-center justify-center shadow-lg shadow-[var(--brand-primary)]/20">
                <RefreshCw size={20} className="md:w-6 md:h-6 text-white" />
            </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base md:text-lg font-black text-slate-900 uppercase tracking-tight mb-1">Gmail Sync</h3>
                <p className="text-[9px] md:text-[10px] font-bold text-[var(--brand-primary)] uppercase tracking-wider">Import transaction emails automatically</p>
            </div>
          </div>

          {user && (
            <div className="space-y-6">
                {/* Info Card */}
                <div className="flex items-start gap-3 p-4 md:p-5 bg-gradient-to-r from-[var(--brand-primary)]/10 via-[var(--brand-accent)]/10 to-[var(--brand-primary)]/10 rounded-2xl border border-[var(--brand-primary)]/20">
                  <div className="w-10 h-10 bg-[var(--brand-primary)]/20 rounded-xl flex items-center justify-center shrink-0">
                    <Info size={18} className="text-[var(--brand-primary)]" />
                </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-black text-slate-800 uppercase tracking-wider mb-1">Choose Sync Period</p>
                    <p className="text-[10px] font-bold text-slate-600 leading-relaxed">
                      Click the sync button below to select a time period. You can sync today, last 3 days, week, 15 days, 30 days, 45 days, 90 days, or choose a custom date range.
                  </p>
                </div>
              </div>

                {/* Enhanced Sync Button */}
              <button
                  onClick={handleSyncClick}
                disabled={isSyncing}
                  className={`w-full h-14 md:h-16 rounded-2xl md:rounded-3xl text-[11px] font-black uppercase tracking-wider shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] relative overflow-hidden group ${
                    isSyncing 
                      ? 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-500 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-[var(--brand-primary)] via-[var(--brand-accent)] to-[var(--brand-primary)] text-white hover:shadow-2xl hover:shadow-[var(--brand-primary)]/40'
                  }`}
                >
                  {!isSyncing && (
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                  <div className="relative z-10 flex items-center gap-3">
                    <RefreshCw className={isSyncing ? 'animate-spin' : ''} size={18} className="md:w-5 md:h-5" />
                    <span className="truncate">{isSyncing ? 'Synchronizing...' : 'Start Gmail Sync'}</span>
                  </div>
                </button>

                {/* Enhanced Sync Progress */}
                {isSyncing && syncProgress && (
                  <div className="bg-gradient-to-br from-white to-slate-50 p-6 md:p-8 rounded-3xl space-y-4 animate-slide-up border-2 border-[var(--brand-primary)]/20 shadow-lg">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[var(--brand-primary)] animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                          {syncProgress.status}
                        </span>
                      </div>
                      <span className="text-[10px] font-black text-[var(--brand-primary)] bg-[var(--brand-primary)]/10 px-3 py-1 rounded-full">
                        {syncProgress.current} / {syncProgress.total}
                      </span>
                    </div>
                    <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-[var(--brand-primary)] via-[var(--brand-accent)] to-[var(--brand-primary)] transition-all duration-300 rounded-full shadow-sm"
                      style={{ width: `${(syncProgress.current / (syncProgress.total || 1)) * 100}%` }}
                    />
                  </div>
                    <div className="text-[11px] font-bold text-slate-700 leading-relaxed flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-primary)] animate-pulse" />
                      {syncProgress.message}
                    </div>
                </div>
              )}
            </div>
          )}

          {!user && (
              <div className="text-center py-12 md:py-16 relative">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-slate-100 to-slate-200 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg">
                  <Clock size={32} className="md:w-10 md:h-10 text-slate-400" />
                </div>
                <h4 className="text-base md:text-lg font-black text-slate-800 mb-2">Connect Your Account</h4>
                <p className="text-sm font-bold text-slate-500 mb-6">Login to enable Gmail sync and start importing transactions</p>
                <button
                  onClick={onLogin}
                  className="px-6 py-3 bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-accent)] text-white rounded-2xl text-[10px] font-black uppercase tracking-wider shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 mx-auto"
                >
                  <LogIn size={16} />
                  Connect Google Account
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Auto-Sync Settings - Mobile Optimized */}
      <div className="glass-card p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
        <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-50 text-emerald-600 rounded-lg md:rounded-xl flex items-center justify-center">
            {autoSyncSettings.enabled ? <Bell size={18} className="md:w-5 md:h-5" /> : <BellOff size={18} className="md:w-5 md:h-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm md:text-base font-extrabold text-slate-800 uppercase tracking-tighter">Auto-Sync Schedule</h3>
            <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase">Automatic transaction sync</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Enable/Disable Toggle - Mobile Optimized */}
          <div className="flex items-center justify-between p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl">
            <div className="flex-1 min-w-0 pr-3">
              <p className="text-xs md:text-sm font-black text-slate-800 mb-0.5 md:mb-1">Enable Auto-Sync</p>
              <p className="text-[8px] md:text-[9px] font-bold text-slate-400 leading-relaxed">
                Automatically sync transactions at scheduled times
              </p>
            </div>
            <button
              onClick={() => handleAutoSyncToggle(!autoSyncSettings.enabled)}
              className={`relative w-12 h-6 md:w-14 md:h-7 rounded-full transition-all duration-300 shrink-0 ${autoSyncSettings.enabled ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              aria-label="Toggle auto-sync"
            >
              <div
                className={`absolute top-0.5 left-0.5 md:top-1 md:left-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${autoSyncSettings.enabled ? 'translate-x-6 md:translate-x-7' : 'translate-x-0'
                  }`}
              />
            </button>
          </div>

          {autoSyncSettings.enabled && (
            <>
              {/* Morning Sync Time - Mobile Optimized */}
              <div className="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl border border-slate-100 space-y-3 md:space-y-4">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div>
                    <h4 className="text-[10px] md:text-xs font-black text-slate-800 uppercase tracking-wider mb-0.5 md:mb-1">Morning Sync</h4>
                    <p className="text-[8px] md:text-[9px] font-bold text-slate-500">Previous day + Today's transactions</p>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-4">
                  <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest md:w-16">Time</label>
                  <TimePicker
                    value={autoSyncSettings.morningTime}
                    onChange={(time) => handleTimeChange('morning', time)}
                    className="flex-1"
                  />
                </div>
                {nextSyncInfo.nextMorning && (
                  <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500">
                    <Clock size={12} />
                    <span>Next sync: {nextSyncInfo.nextMorning.toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</span>
                    {autoSyncSettings.lastMorningSync && (
                      <span className="ml-auto">Last: {new Date(autoSyncSettings.lastMorningSync).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Evening Sync Time - Mobile Optimized */}
              <div className="bg-white p-4 md:p-6 rounded-xl md:rounded-2xl border border-slate-100 space-y-3 md:space-y-4">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <div>
                    <h4 className="text-[10px] md:text-xs font-black text-slate-800 uppercase tracking-wider mb-0.5 md:mb-1">Evening Sync</h4>
                    <p className="text-[8px] md:text-[9px] font-bold text-slate-500">Today's transactions only</p>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-4">
                  <label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest md:w-16">Time</label>
                  <TimePicker
                    value={autoSyncSettings.eveningTime}
                    onChange={(time) => handleTimeChange('evening', time)}
                    className="flex-1"
                  />
                </div>
                {nextSyncInfo.nextEvening && (
                  <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500">
                    <Clock size={12} />
                    <span>Next sync: {nextSyncInfo.nextEvening.toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</span>
                    {autoSyncSettings.lastEveningSync && (
                      <span className="ml-auto">Last: {new Date(autoSyncSettings.lastEveningSync).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                  </div>
                )}
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <div className="flex items-start gap-3">
                  <Info size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-black text-emerald-900 uppercase tracking-wider mb-1">
                      How Auto-Sync Works
                    </p>
                    <p className="text-[9px] font-bold text-emerald-700 leading-relaxed">
                      Morning sync includes previous day + today. Evening sync only includes today. Sync runs automatically when you're logged in.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* NEW: AI & Development Settings - Mobile Optimized */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Gemini API Key */}
        <div className="glass-card p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
          <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-50 text-purple-600 rounded-lg md:rounded-xl flex items-center justify-center">
              <Sparkles size={18} className="md:w-5 md:h-5" />
            </div>
            <h3 className="text-sm md:text-base font-extrabold text-slate-800 uppercase tracking-tighter">AI Configuration</h3>
          </div>

          <div className="space-y-5">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block flex items-center gap-2">
                <Key size={12} className="text-purple-500" />
                Gemini API Key
                {hasEnvApiKey && (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded-md text-[8px] font-bold">
                    Using .env.local
                  </span>
                )}
              </label>
              <form onSubmit={(e) => e.preventDefault()} className="relative">
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder={hasEnvApiKey ? "Using environment key" : "Paste your Gemini API key"}
                  value={geminiApiKey}
                  onChange={(e) => onGeminiApiKeyChange(e.target.value)}
                  disabled={hasEnvApiKey}
                  className={`w-full bg-slate-50 border-none rounded-2xl h-12 px-4 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-purple-100 transition-all ${hasEnvApiKey ? 'opacity-60 cursor-not-allowed' : ''}`}
                />
              </form>
              <p className="text-[9px] font-bold text-slate-400 mt-2 leading-relaxed">
                {hasEnvApiKey
                  ? "Priority: .env.local key is being used. App key is ignored."
                  : "Get your free API key from ai.google.dev"}
              </p>
            </div>
          </div>
        </div>

        {/* Development Settings */}
        <div className="glass-card p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
          <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-50 text-indigo-600 rounded-lg md:rounded-xl flex items-center justify-center">
              {showDummyData ? <Eye size={18} className="md:w-5 md:h-5" /> : <EyeOff size={18} className="md:w-5 md:h-5" />}
            </div>
            <h3 className="text-sm md:text-base font-extrabold text-slate-800 uppercase tracking-tighter">Development Mode</h3>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
              <div className="flex-1">
                <p className="text-xs font-black text-slate-800 mb-1">Show Dummy Transactions</p>
                <p className="text-[9px] font-bold text-slate-400 leading-relaxed">
                  Display sample transactions for testing and demo purposes
                </p>
              </div>
              <button
                onClick={() => onToggleDummyData(!showDummyData)}
                className={`relative w-14 h-7 rounded-full transition-all duration-300 ${showDummyData ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                aria-label="Toggle dummy data"
              >
                <div
                  className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${showDummyData ? 'translate-x-7' : 'translate-x-0'
                    }`}
                />
              </button>
            </div>

            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
              <div className="flex items-start gap-3">
                <Info size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-black text-indigo-900 uppercase tracking-wider mb-1">
                    Development Feature
                  </p>
                  <p className="text-[9px] font-bold text-indigo-700 leading-relaxed">
                    Dummy data helps you test the UI without syncing your Gmail. Perfect for demos and development.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Browser Notifications Section */}
      <div className="lg:col-span-2 glass-card p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-primary)]/5 via-[var(--brand-accent)]/5 to-[var(--brand-blue)]/5 pointer-events-none" />
        
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[var(--brand-primary)]/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-[var(--brand-accent)]/10 to-transparent rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4 md:mb-6">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-[var(--brand-primary)]/20 to-[var(--brand-accent)]/20 rounded-xl md:rounded-2xl flex items-center justify-center">
              <BellRing size={18} className="md:w-6 md:h-6 text-[var(--brand-primary)]" strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-black text-slate-800 uppercase tracking-wider">Browser Notifications</h3>
              <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Desktop notifications outside browser</p>
            </div>
          </div>

          {/* Notification Permission Status */}
          <div className="mb-4 md:mb-6 p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bell size={14} className="text-slate-500" />
                <span className="text-[10px] md:text-xs font-black text-slate-700 uppercase tracking-wider">Permission Status</span>
              </div>
              <span className={`px-2 py-1 rounded-lg text-[8px] md:text-[9px] font-black uppercase ${
                notificationPermission === 'granted'
                  ? 'bg-emerald-100 text-emerald-600'
                  : notificationPermission === 'denied'
                  ? 'bg-rose-100 text-rose-600'
                  : 'bg-amber-100 text-amber-600'
              }`}>
                {notificationPermission === 'granted' ? 'Granted' : 
                 notificationPermission === 'denied' ? 'Denied' : 'Not Requested'}
              </span>
            </div>
            
            {notificationPermission !== 'granted' && (
              <button
                onClick={async () => {
                  const permission = await NotificationManager.requestPermission();
                  setNotificationPermission(permission);
                  if (permission === 'granted') {
                    await NotificationManager.enable();
                    setNotificationsEnabled(true);
                    alert('Notification permission granted! You can now receive desktop notifications.');
                  } else if (permission === 'denied') {
                    alert('Notification permission denied. Please enable it from your browser settings.');
                  }
                }}
                className="w-full mt-2 px-4 py-2.5 bg-[var(--brand-primary)] text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-[var(--brand-primary)]/90 transition-all active:scale-95"
              >
                Request Permission
              </button>
            )}
          </div>

          {/* Notification Toggle */}
          <div className="mb-4 md:mb-6 p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl border border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[var(--brand-primary)]/10 rounded-lg flex items-center justify-center">
                  <BellRing size={14} className="text-[var(--brand-primary)]" />
                </div>
                <div>
                  <p className="text-[10px] md:text-xs font-black text-slate-800 uppercase tracking-wider">Enable Notifications</p>
                  <p className="text-[8px] md:text-[9px] font-bold text-slate-400">Receive notifications outside browser</p>
                </div>
              </div>
              <button
                onClick={async () => {
                  if (notificationsEnabled) {
                    NotificationManager.disable();
                    setNotificationsEnabled(false);
                  } else {
                    const enabled = await NotificationManager.enable();
                    setNotificationsEnabled(enabled);
                    setNotificationPermission(NotificationManager.getPermission());
                  }
                }}
                disabled={notificationPermission !== 'granted'}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  notificationsEnabled && notificationPermission === 'granted'
                    ? 'bg-[var(--brand-primary)]'
                    : 'bg-slate-300'
                } ${notificationPermission !== 'granted' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    notificationsEnabled && notificationPermission === 'granted'
                      ? 'translate-x-6'
                      : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Notification Preferences */}
          {notificationsEnabled && notificationPermission === 'granted' && (
            <div className="space-y-3 md:space-y-4">
              <div className="p-3 md:p-4 bg-white rounded-xl md:rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    <span className="text-[10px] md:text-xs font-black text-slate-700 uppercase tracking-wider">Transaction Notifications</span>
                  </div>
                  <button
                    onClick={() => {
                      const newValue = !transactionNotifications;
                      setTransactionNotifications(newValue);
                      localStorage.setItem('qpay_transaction_notifications', newValue.toString());
                    }}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      transactionNotifications
                        ? 'bg-emerald-500'
                        : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                        transactionNotifications
                          ? 'translate-x-5'
                          : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-[8px] md:text-[9px] font-bold text-slate-400">Get notified when new transactions are detected</p>
              </div>

              {/* Individual Transaction Notifications */}
              {transactionNotifications && (
                <div className="p-3 md:p-4 bg-white rounded-xl md:rounded-2xl border border-slate-100 ml-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Bell size={12} className="text-slate-500" />
                      <span className="text-[9px] md:text-[10px] font-black text-slate-700 uppercase tracking-wider">Individual Alerts</span>
                    </div>
                    <button
                      onClick={() => {
                        const newValue = !individualTransactionNotifications;
                        setIndividualTransactionNotifications(newValue);
                        localStorage.setItem('qpay_individual_transaction_notifications', newValue.toString());
                      }}
                      className={`relative w-10 h-5 rounded-full transition-colors ${
                        individualTransactionNotifications
                          ? 'bg-emerald-500'
                          : 'bg-slate-300'
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                          individualTransactionNotifications
                            ? 'translate-x-5'
                            : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-[8px] md:text-[9px] font-bold text-slate-400">Show notification for each transaction</p>
                </div>
              )}

              <div className="p-3 md:p-4 bg-white rounded-xl md:rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <RefreshCw size={14} className="text-[var(--brand-primary)]" />
                    <span className="text-[10px] md:text-xs font-black text-slate-700 uppercase tracking-wider">Sync Notifications</span>
                  </div>
                  <button
                    onClick={() => {
                      const newValue = !syncNotifications;
                      setSyncNotifications(newValue);
                      localStorage.setItem('qpay_sync_notifications', newValue.toString());
                    }}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      syncNotifications
                        ? 'bg-[var(--brand-primary)]'
                        : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                        syncNotifications
                          ? 'translate-x-5'
                          : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-[8px] md:text-[9px] font-bold text-slate-400">Get notified when sync completes or fails</p>
              </div>

              {/* Test Notification Button */}
              <button
                onClick={async () => {
                  try {
                    console.log('🔔 Test notification button clicked');
                    const success = await NotificationManager.testNotification();
                    
                    if (success) {
                      // Update permission state after test
                      setNotificationPermission(NotificationManager.getPermission());
                      setNotificationsEnabled(NotificationManager.getIsEnabled());
                      
                      // Show success message after a short delay
                      setTimeout(() => {
                        console.log('✅ Test notification completed successfully');
                      }, 100);
                    } else {
                      // Update permission state even on failure
                      setNotificationPermission(NotificationManager.getPermission());
                      setNotificationsEnabled(NotificationManager.getIsEnabled());
                    }
                  } catch (error: any) {
                    console.error('❌ Test notification error:', error);
                    alert(`Error: ${error?.message || error}\n\nPlease check:\n1. Browser console (F12) for details\n2. Browser notification settings\n3. Make sure you are on HTTPS or localhost\n4. Check OS notification settings`);
                    
                    // Update permission state
                    setNotificationPermission(NotificationManager.getPermission());
                    setNotificationsEnabled(NotificationManager.getIsEnabled());
                  }
                }}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:from-blue-700 hover:to-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Bell size={14} />
                Test Notification
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Data Management - Mobile Optimized */}
      <div className="glass-card p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6">
        <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-rose-50 text-rose-600 rounded-lg md:rounded-xl flex items-center justify-center">
            <Trash2 size={18} className="md:w-5 md:h-5" />
          </div>
          <div>
            <h3 className="text-sm md:text-base font-extrabold text-slate-800 uppercase tracking-tighter">Data Management</h3>
            <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase">Clear local storage</p>
          </div>
        </div>

        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-black text-rose-900 mb-2">Danger Zone</p>
              <p className="text-[10px] font-bold text-rose-700 leading-relaxed">
                This action will permanently delete all locally stored transactions. Your Gmail emails remain untouched. You can re-sync anytime.
              </p>
            </div>
          </div>

          <button
            onClick={onClearData}
            className="w-full h-12 bg-white border-2 border-rose-300 text-rose-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <Trash2 size={16} />
            Clear All Local Data
          </button>
        </div>

        {/* Privacy Policy & Terms of Service Links */}
        <div className="mt-8 pt-6 border-t border-slate-200 space-y-3">
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-slate-600 hover:text-[var(--brand-primary)] transition-colors text-sm font-bold rounded-xl hover:bg-slate-50 active:scale-95"
          >
            <Shield size={16} />
            <span>Privacy Policy</span>
            <ExternalLink size={14} className="opacity-60" />
          </a>
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-slate-600 hover:text-[var(--brand-primary)] transition-colors text-sm font-bold rounded-xl hover:bg-slate-50 active:scale-95"
          >
            <FileText size={16} />
            <span>Terms of Service</span>
            <ExternalLink size={14} className="opacity-60" />
          </a>
        </div>
      </div>

    </div>
  );
};

export default Settings;
