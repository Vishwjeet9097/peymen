
import React, { useState, useEffect } from 'react';
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
  Wallet
} from 'lucide-react';
import NotificationModal from './NotificationModal';
import { notificationService } from '../services/notifications';
import { Notification } from '../types';
import PrivacyPolicy from './PrivacyPolicy';
import TermsOfService from './TermsOfService';

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

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleClearAll = () => {
    notificationService.clearAll();
  };

  const handleMarkAsRead = (id: string) => {
    notificationService.markAsRead(id);
  };

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', strokeWidth: 2 },
    { id: 'transactions', icon: Receipt, label: 'Transactions', strokeWidth: 2 },
    { id: 'analytics', icon: TrendingUp, label: 'Analytics', strokeWidth: 2 },
    { id: 'settings', icon: Settings, label: 'Settings', strokeWidth: 2 },
  ];

  return (
    <div className="flex h-screen bg-[var(--bg-base)] overflow-hidden">

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-100 py-10 relative shrink-0">
        <div className="px-10 mb-12 flex items-center gap-3">
          <img 
            src="/logo.png" 
            alt="Peymen Logo" 
            className="w-10 h-10 object-contain"
          />
          <div className="text-[var(--brand-primary)] font-extrabold text-2xl tracking-tighter">Peymen</div>
        </div>

        <nav className="flex-1 flex flex-col">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative px-10 py-4 flex items-center gap-4 text-sm transition-all hover:bg-slate-50 group border-l-4 ${activeTab === item.id
                ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/5 text-[var(--brand-primary)]'
                : 'border-transparent text-slate-400 font-medium'
                }`}
            >
              <item.icon
                size={18}
                strokeWidth={activeTab === item.id ? 2.5 : item.strokeWidth}
                className={`transition-transform group-hover:scale-110 ${activeTab === item.id ? 'animate-pulse' : ''}`}
              />
              {item.label}
            </button>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="px-6 mb-8">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-3 bg-rose-50 hover:bg-rose-100 text-rose-600 text-sm font-bold py-4 rounded-2xl transition-all active:scale-95 border-2 border-rose-100 hover:border-rose-200 group"
          >
            <LogOut size={18} strokeWidth={2} className="transition-transform group-hover:translate-x-1" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Desktop Header */}
        <header className="hidden lg:flex h-24 items-center justify-between px-12 bg-transparent shrink-0">
          <div className="flex flex-col">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Hi {user?.name.split(' ')[0] || 'Guest'},</span>
            <h1 className="text-2xl font-black text-slate-900 leading-tight">Welcome to Peymen</h1>
          </div>

          <div className="flex items-center gap-8">
            <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center text-slate-400 pointer-events-none">
                <Search size={16} />
              </div>
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="bg-white border-none text-xs font-medium focus:ring-2 focus:ring-[var(--brand-primary)]/10 w-64 h-11 pl-12 pr-4 rounded-2xl shadow-sm"
              />
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsNotificationModalOpen(true)}
                className="relative w-11 h-11 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm transition-transform active:scale-95 hover:bg-slate-50"
                aria-label="Notifications"
              >
                <Bell size={18} strokeWidth={2} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[9px] font-black">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              <div className="w-11 h-11 bg-slate-200 rounded-2xl overflow-hidden shadow-sm">
                {user ? <img src={user.picture} alt="Avatar" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-[var(--brand-primary)]/10 flex items-center justify-center text-[var(--brand-primary)] font-bold text-xs">U</div>}
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Header - Modern Card Style */}
        <header className="lg:hidden px-4 pt-6 pb-4 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm text-slate-500 font-medium">Hello,</h2>
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

          {/* Transactions / Cards */}
          <button
            onClick={() => setActiveTab('transactions')}
            className={`nav-item ${activeTab === 'transactions' ? 'active' : ''}`}
            aria-label="Transactions"
          >
            <History
              size={24}
              strokeWidth={activeTab === 'transactions' ? 2.5 : 2}
            />
            <span className="nav-item-label">Cards</span>
          </button>

          {/* Center Action Button - Cloud Sync */}
          <div className="center-action-wrapper">
            <button
              onClick={onSync}
              disabled={isSyncing}
              className={`center-action-button ${isSyncing ? 'syncing' : ''}`}
              aria-label="Sync Today's Transactions"
            >
              <CloudSync 
                size={28} 
                strokeWidth={2.5} 
                className={isSyncing ? 'sync-icon-animation' : ''}
              />
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
