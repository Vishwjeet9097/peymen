
import React, { useState, useEffect, useRef } from 'react';
import {
  // Navigation & Actions
  LayoutDashboard,
  Settings,
  Home,
  LogOut,
  Plus,
  HousePlus,
  CirclePlus,
  CloudSync,

  // Features
  Receipt,
  BarChart2,
  User2 as User,
  PieChart,
  History,

  // UI Elements
  Search,
  Bell,
  BellDot,
  Menu,
  X,

  // Enhanced alternatives
  Sparkles,
  TrendingUp,
  Wallet,
  Wifi,
  WifiOff,
  
  // Professional Icons
  Home as HomeIcon,
  CreditCard,
  LineChart,
  Sliders
} from 'lucide-react';
import NotificationModal from './NotificationModal';
import { notificationService } from '../services/notifications';
import { Notification } from '../types';
import PrivacyPolicy from './PrivacyPolicy';
import TermsOfService from './TermsOfService';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

import { Transaction } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: any;
  onLogout: () => void;
  onLogin: () => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  onAddClick?: () => void;
  onSync?: () => void;
  isSyncing?: boolean;
  transactions?: Transaction[];
}

const Layout: React.FC<LayoutProps> = ({
  children,
  activeTab,
  setActiveTab,
  user,
  onLogout,
  onLogin,
  searchQuery,
  onSearchChange,
  onAddClick,
  onSync,
  isSyncing = false,
  transactions = []
}) => {
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Online/Offline status detection
  const { isOnline, isOffline } = useOnlineStatus();
  const previousOnlineStatus = useRef<boolean>(isOnline);
  const hasShownOfflineNotification = useRef<boolean>(false);
  const hasShownOnlineNotification = useRef<boolean>(false);

  // Load notifications on mount
  useEffect(() => {
    const loaded = notificationService.loadNotifications();
    setNotifications(loaded);

    // Subscribe to notification changes
    const unsubscribe = notificationService.subscribe((newNotifications) => {
      setNotifications(newNotifications);
    });

    return unsubscribe;
  }, []);

  // Handle online/offline status changes and show notifications
  useEffect(() => {
    // Only show notification when status actually changes
    if (previousOnlineStatus.current !== isOnline) {
      if (isOffline) {
        // Went offline
        notificationService.add(
          'warning',
          'You\'re Offline',
          'Some features may be limited. Your data is saved locally and will sync when you\'re back online.',
          true
        );
        hasShownOfflineNotification.current = true;
        hasShownOnlineNotification.current = false;
      } else {
        // Came back online
        notificationService.add(
          'success',
          'You\'re Back Online',
          'Connection restored. Your data will sync automatically.',
          true
        );
        hasShownOnlineNotification.current = true;
        hasShownOfflineNotification.current = false;
      }
      previousOnlineStatus.current = isOnline;
    }
  }, [isOnline, isOffline]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleClearAll = () => {
    notificationService.clearAll();
  };

  const handleMarkAsRead = (id: string) => {
    notificationService.markAsRead(id);
  };

  const menuItems = [
    { id: 'dashboard', icon: HomeIcon, label: 'Dashboard', strokeWidth: 2.5 },
    { id: 'transactions', icon: CreditCard, label: 'Transactions', strokeWidth: 2.5 },
    { id: 'analytics', icon: LineChart, label: 'Analytics', strokeWidth: 2.5 },
    { id: 'settings', icon: Sliders, label: 'Settings', strokeWidth: 2.5 },
  ];

  return (
    <div className="flex h-screen bg-[var(--bg-base)] overflow-hidden">
      
      {/* Offline Banner - Always visible when offline */}
      {isOffline && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-3 shadow-lg animate-slide-down">
          <div className="flex items-center justify-center gap-3 max-w-7xl mx-auto">
            <WifiOff size={18} strokeWidth={2.5} className="animate-pulse" />
            <p className="text-sm font-bold">
              You're offline. Some features may be limited. Your data is saved locally.
            </p>
          </div>
        </div>
      )}

      {/* Desktop Sidebar - Premium Fintech Design */}
      <aside className="hidden lg:flex flex-col w-72 bg-gradient-to-b from-white via-slate-50/40 to-white border-r border-slate-200/80 relative shrink-0 shadow-[2px_0_24px_rgba(79,70,229,0.04)]">
        {/* Logo Section - Premium Branding */}
        <div className="px-8 pt-10 pb-8 border-b border-slate-200/60">
          <div className="flex items-center gap-3.5 group cursor-pointer">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-primary)]/30 to-[var(--brand-accent)]/30 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-lg shadow-slate-200/50 ring-1 ring-slate-200/50 overflow-hidden group-hover:ring-[var(--brand-primary)]/20 transition-all duration-300">
                <img 
                  src="/logo.png" 
                  alt="Peymen" 
                  className="w-full h-full object-contain "
                />
              </div>
            </div>
            <div>
              <div 
                className="text-2xl font-black tracking-tight leading-none"
                style={{
                  background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Peymen
              </div>
              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.15em] mt-1">Finance</div>
            </div>
          </div>
        </div>

        {/* Navigation Menu - Premium with Glass Effect */}
        <nav className="flex-1 flex flex-col px-4 py-6 space-y-1.5">
          {menuItems.map((item, index) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative px-4 py-3.5 flex items-center gap-4 text-sm font-semibold rounded-2xl transition-all duration-300 group overflow-hidden ${
                  isActive
                    ? 'bg-gradient-to-r from-[var(--brand-primary)]/12 via-[var(--brand-primary)]/8 to-transparent text-[var(--brand-primary)] shadow-md shadow-[var(--brand-primary)]/10'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                }`}
              >
                {/* Active Indicator - Thick Bar */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-gradient-to-b from-[var(--brand-primary)] via-[var(--brand-primary)] to-[var(--brand-accent)] rounded-r-full shadow-sm"></div>
                )}
                
                {/* Icon Container with Premium Styling */}
                <div className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-br from-[var(--brand-primary)]/15 to-[var(--brand-accent)]/15 shadow-sm ring-1 ring-[var(--brand-primary)]/20'
                    : 'bg-slate-100/80 group-hover:bg-slate-200/80 group-hover:scale-105'
                }`}>
                  <item.icon
                    size={20}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={`transition-all duration-300 ${
                      isActive 
                        ? 'text-[var(--brand-primary)]' 
                        : 'text-slate-500 group-hover:text-slate-700'
                    }`}
                  />
                </div>
                
                {/* Label */}
                <span className={`relative transition-all duration-300 ${isActive ? 'font-bold' : 'font-semibold'}`}>
                  {item.label}
                </span>
                
                {/* Subtle Hover Glow */}
                {!isActive && (
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[var(--brand-primary)]/0 via-[var(--brand-primary)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Section - User Profile & Logout */}
        <div className="px-4 pb-6 border-t border-slate-200/60 pt-6 space-y-3">
          {/* User Profile Card */}
          {user && (
            <div className="px-4 py-3.5 rounded-2xl bg-gradient-to-br from-slate-50/80 to-white border border-slate-200/60 shadow-sm backdrop-blur-sm">
              <div className="flex items-center gap-3.5">
                <div className="relative">
                  <div className="w-11 h-11 rounded-xl overflow-hidden bg-gradient-to-br from-[var(--brand-primary)]/20 to-[var(--brand-accent)]/20 flex items-center justify-center ring-2 ring-slate-200/60 shadow-sm">
                    {user.picture ? (
                      <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span 
                        className="text-base font-bold"
                        style={{
                          background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                        }}
                      >
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                  {isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate leading-tight">{user.name?.split(' ')[0] || 'User'}</p>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">{user.email?.split('@')[0] || ''}</p>
                </div>
              </div>
            </div>
          )}

          {/* Logout Button - Premium Styling */}
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-slate-50 to-slate-100/50 hover:from-slate-100 hover:to-slate-200 text-slate-700 hover:text-slate-900 text-sm font-semibold py-3 rounded-2xl transition-all duration-300 active:scale-[0.97] border border-slate-200/60 hover:border-slate-300/80 shadow-sm hover:shadow-md group"
          >
            <LogOut 
              size={17} 
              strokeWidth={2.5} 
              className="transition-transform duration-300 group-hover:translate-x-1" 
            />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Desktop Header - Premium Fintech Design */}
        <header className={`hidden lg:flex h-20 items-center justify-between px-10 bg-gradient-to-r from-white via-slate-50/30 to-white border-b border-slate-200/60 backdrop-blur-sm shrink-0 ${isOffline ? 'mt-12' : ''} shadow-sm`}>
          {/* Left Section - Greeting & Status */}
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-black text-slate-900 leading-tight">
                  Welcome back, <span className="text-[var(--brand-primary)]">{user?.name.split(' ')[0] || 'Guest'}</span>
                </h1>
                {isOffline && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg border border-amber-200/60 shadow-sm">
                    <WifiOff size={13} strokeWidth={2.5} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Offline</span>
                  </div>
                )}
                {isOnline && !isOffline && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200/60 shadow-sm">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Online</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">Manage your finances effortlessly</p>
            </div>
          </div>

          {/* Right Section - Search & Actions */}
          <div className="flex items-center gap-4">
            {/* Premium Search Bar */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center text-slate-400 pointer-events-none transition-colors group-focus-within:text-[var(--brand-primary)]">
                <Search size={17} strokeWidth={2} />
              </div>
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="bg-white/80 backdrop-blur-sm border border-slate-200/60 text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]/30 w-72 h-11 pl-12 pr-4 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 focus:bg-white focus:w-80"
              />
            </div>

            {/* Notification Button - Premium */}
            <button 
              onClick={() => setIsNotificationModalOpen(true)}
              className="relative w-11 h-11 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center text-slate-500 hover:text-slate-700 shadow-sm hover:shadow-md transition-all duration-200 active:scale-95 border border-slate-200/60 hover:border-slate-300/80 group"
              aria-label="Notifications"
            >
              <Bell size={18} strokeWidth={2} className="transition-transform group-hover:scale-110" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-rose-500 to-rose-600 text-white rounded-full flex items-center justify-center text-[9px] font-black shadow-lg ring-2 ring-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* User Avatar - Premium */}
            <div className="relative group cursor-pointer">
              <div className="w-11 h-11 rounded-2xl overflow-hidden bg-gradient-to-br from-[var(--brand-primary)]/20 to-[var(--brand-accent)]/20 ring-2 ring-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200 hover:ring-[var(--brand-primary)]/30">
                {user?.picture ? (
                  <img src={user.picture} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span 
                      className="text-base font-bold"
                      style={{
                        background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}
                    >
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
              </div>
              {isOnline && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Header - Modern Card Style */}
        <header className={`lg:hidden px-4 pt-6 pb-4 shrink-0 ${isOffline ? 'pt-20' : ''}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-sm text-slate-500 font-medium">Hello,</h2>
                {isOffline && (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-lg">
                    <WifiOff size={10} strokeWidth={2.5} />
                    <span className="text-[8px] font-black uppercase">Offline</span>
                  </div>
                )}
                {isOnline && !isOffline && (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-lg">
                    <Wifi size={10} strokeWidth={2.5} />
                    <span className="text-[8px] font-black uppercase">Online</span>
                  </div>
                )}
              </div>
              <h1 className="text-2xl font-black text-slate-900">{user?.name.split(' ')[0] || 'Guest'} 👋</h1>
            </div>
            <button 
              onClick={() => setIsNotificationModalOpen(true)}
              className="relative w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-700 shadow-sm active:scale-95 hover:shadow-md transition-all group"
              aria-label="Notifications"
            >
              <BellDot size={20} strokeWidth={2} className="group-active:rotate-12 transition-transform" />
              {unreadCount > 0 && (
                <span className="absolute w-2 h-2 bg-rose-500 rounded-full top-2 right-2 animate-pulse"></span>
              )}
            </button>
          </div>
        </header>

        {/* Workspace */}
        <main className="flex-1 overflow-y-auto hide-scrollbar px-4 lg:px-12 pb-24 lg:pb-12">
          {children}
        </main>
      </div>

      {/* Bottom Navigation - Fintech UI Pattern */}
      <div className="bottom-nav-container lg:hidden">
        <nav className="bottom-nav-pill">

          {/* Home */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            aria-label="Home"
          >
            <HousePlus
              size={24}
              strokeWidth={activeTab === 'dashboard' ? 2.5 : 2}
            />
            <span className="nav-item-label">Home</span>
          </button>

          {/* Transactions / History */}
          <button
            onClick={() => setActiveTab('transactions')}
            className={`nav-item ${activeTab === 'transactions' ? 'active' : ''}`}
            aria-label="Transactions"
          >
            <History
              size={24}
              strokeWidth={activeTab === 'transactions' ? 2.5 : 2}
            />
            <span className="nav-item-label">History</span>
          </button>

          {/* Center Action Button - Cloud Sync */}
          <div className="center-action-wrapper">
            <button
              onClick={onSync}
              disabled={isSyncing || isOffline}
              className={`center-action-button ${isSyncing ? 'syncing' : ''} ${isOffline ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label="Sync Today's Transactions"
              title={isOffline ? 'Sync unavailable offline' : 'Sync Today\'s Transactions'}
            >
              <CloudSync 
                size={28} 
                strokeWidth={2.5} 
                className={isSyncing ? 'sync-icon-animation' : ''}
              />
              {isOffline && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white"></div>
              )}
            </button>
          </div>

          {/* Analytics */}
          <button
            onClick={() => setActiveTab('analytics')}
            className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
            aria-label="Analytics"
          >
            <PieChart
              size={24}
              strokeWidth={activeTab === 'analytics' ? 2.5 : 2}
            />
            <span className="nav-item-label">Stats</span>
          </button>

          {/* Settings / Profile */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            aria-label="Settings"
          >
            <Settings
              size={24}
              strokeWidth={activeTab === 'settings' ? 2.5 : 2}
            />
            <span className="nav-item-label">Profile</span>
          </button>

        </nav>
      </div>

      {/* Notification Modal */}
      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        notifications={notifications}
        onClearAll={handleClearAll}
        onMarkAsRead={handleMarkAsRead}
        transactions={transactions}
      />
    </div>
  );
};

export default Layout;
