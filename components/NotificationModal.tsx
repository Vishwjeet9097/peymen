
import React from 'react';
import { Notification, Transaction } from '../types';
import { 
  X, 
  Bell, 
  CheckCircle2, 
  Info, 
  AlertTriangle, 
  AlertCircle,
  Trash2,
  Clock,
  ArrowDownCircle,
  ArrowUpCircle,
  CreditCard
} from 'lucide-react';
// Simple time formatter (no external dependency)
const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return new Date(date).toLocaleDateString();
};

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onClearAll: () => void;
  onMarkAsRead: (id: string) => void;
  transactions?: Transaction[];
}

const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onClearAll,
  onMarkAsRead,
  transactions = []
}) => {
  if (!isOpen) return null;

  // Get last 5 notifications
  const last5Notifications = notifications.slice(0, 5);
  const unreadCount = notifications.filter(n => !n.read).length;

  // Get last 5 recent transactions (sorted by date, newest first)
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    const iconProps = { size: 18, strokeWidth: 2.5 };
    switch (type) {
      case 'success':
        return <CheckCircle2 {...iconProps} className="text-emerald-500" />;
      case 'info':
        return <Info {...iconProps} className="text-blue-500" />;
      case 'warning':
        return <AlertTriangle {...iconProps} className="text-amber-500" />;
      case 'error':
        return <AlertCircle {...iconProps} className="text-rose-500" />;
    }
  };

  const getNotificationBg = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50 border-emerald-100';
      case 'info':
        return 'bg-blue-50 border-blue-100';
      case 'warning':
        return 'bg-amber-50 border-amber-100';
      case 'error':
        return 'bg-rose-50 border-rose-100';
    }
  };

  const formatTime = (date: Date) => {
    try {
      return formatTimeAgo(date);
    } catch {
      return 'Just now';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md animate-fade-in sm:bg-slate-900/60" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal Card */}
      <div 
        className="relative w-full sm:max-w-md bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden animate-slide-up sm:my-auto max-h-[85vh] sm:max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative px-6 sm:px-8 pt-6 sm:pt-8 pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--brand-primary)]/10 rounded-xl flex items-center justify-center">
                <Bell size={20} className="text-[var(--brand-primary)]" strokeWidth={2.5} />
              </div>
              <div>
                <h3 id="notification-modal-title" className="text-lg font-black text-slate-900">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {unreadCount} unread
                  </p>
                )}
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
              aria-label="Close notifications"
            >
              <X size={18} strokeWidth={2.5} />
            </button>
          </div>

          {/* Clear All Button */}
          {notifications.length > 0 && (
            <button
              onClick={onClearAll}
              className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-[10px] font-black text-slate-600 uppercase tracking-widest transition-colors"
            >
              <Trash2 size={12} strokeWidth={2.5} />
              Clear All
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto hide-scrollbar">
          <div className="p-4 sm:p-6 space-y-6">
            {/* Notifications Section */}
            {last5Notifications.length > 0 ? (
              <div className="space-y-3">
                {last5Notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => !notification.read && onMarkAsRead(notification.id)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer hover:shadow-md active:scale-[0.98] ${
                      notification.read 
                        ? 'bg-white border-slate-100' 
                        : `${getNotificationBg(notification.type)} border-opacity-50`
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${
                        notification.read ? 'bg-slate-100' : getNotificationBg(notification.type)
                      }`}>
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className={`text-sm font-black leading-tight ${
                            notification.read ? 'text-slate-700' : 'text-slate-900'
                          }`}>
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-[var(--brand-primary)] rounded-full shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className={`text-xs leading-relaxed mb-2 ${
                          notification.read ? 'text-slate-500' : 'text-slate-600'
                        }`}>
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                          <Clock size={10} strokeWidth={2.5} />
                          <span>{formatTime(notification.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 px-6 text-center">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                  <Bell size={20} className="text-slate-400" strokeWidth={2} />
                </div>
                <h4 className="text-sm font-black text-slate-700 mb-1">No Notifications</h4>
                <p className="text-xs font-bold text-slate-400 leading-relaxed">
                  You're all caught up!
                </p>
              </div>
            )}

            {/* Recent Transactions Section */}
            {recentTransactions.length > 0 && (
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard size={16} className="text-slate-600" strokeWidth={2.5} />
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Recent Transactions
                  </h3>
                </div>
                <div className="space-y-2">
                  {recentTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="p-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {/* Transaction Icon */}
                          <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                            transaction.type === 'DEBIT' 
                              ? 'bg-rose-50 text-rose-600' 
                              : transaction.type === 'CREDIT'
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-blue-50 text-blue-600'
                          }`}>
                            {transaction.type === 'DEBIT' ? (
                              <ArrowDownCircle size={16} strokeWidth={2.5} />
                            ) : transaction.type === 'CREDIT' ? (
                              <ArrowUpCircle size={16} strokeWidth={2.5} />
                            ) : (
                              <CreditCard size={16} strokeWidth={2.5} />
                            )}
                          </div>

                          {/* Transaction Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="text-xs font-black text-slate-900 truncate">
                                {transaction.merchant || 'Unknown'}
                              </h4>
                              <span className={`text-xs font-black shrink-0 ${
                                transaction.type === 'DEBIT' 
                                  ? 'text-rose-600' 
                                  : transaction.type === 'CREDIT'
                                  ? 'text-emerald-600'
                                  : 'text-blue-600'
                              }`}>
                                {transaction.type === 'DEBIT' ? '-' : '+'}
                                {formatCurrency(Math.abs(transaction.amount), transaction.currency)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                              <span className="truncate">{transaction.source || 'Payment'}</span>
                              <span>•</span>
                              <Clock size={9} strokeWidth={2.5} />
                              <span>{formatTime(transaction.date)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default NotificationModal;
