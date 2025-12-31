
import React from 'react';
import { 
  X, 
  ShoppingBag, 
  CreditCard, 
  Calendar, 
  Tag, 
  IndianRupee,
  ArrowDownCircle,
  ArrowUpCircle,
  ArrowLeftRight,
  FileText,
  Copy,
  Check,
  Clock,
  MapPin,
  Building2,
  Wallet,
  Hash,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft
} from 'lucide-react';
import { Transaction, TransactionType } from '../types';
import { formatINR } from '../utils/currency';
import { MerchantLogoComponent } from '../utils/merchantLogos';

interface TransactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  transaction 
}) => {
  const [copied, setCopied] = React.useState(false);

  // Auto-focus management
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !transaction) return null;

  const getTypeIcon = (type: TransactionType) => {
    switch (type) {
      case 'DEBIT':
        return <ArrowDownCircle size={20} className="text-indigo-500" />;
      case 'CREDIT':
        return <ArrowUpCircle size={20} className="text-emerald-500" />;
      case 'TRANSFER':
        return <ArrowLeftRight size={20} className="text-sky-500" />;
      default:
        return <ShoppingBag size={20} className="text-slate-400" />;
    }
  };

  const getTypeColor = (type: TransactionType) => {
    switch (type) {
      case 'DEBIT':
        return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'CREDIT':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'TRANSFER':
        return 'bg-sky-50 text-sky-600 border-sky-100';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(transaction.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatShortDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getCategoryIcon = (category: string) => {
    const iconProps = { size: 20, strokeWidth: 2 };
    switch (category.toLowerCase()) {
      case 'shopping': return <ShoppingBag {...iconProps} />;
      case 'dining': return <Tag {...iconProps} />;
      case 'transport': return <MapPin {...iconProps} />;
      case 'subscription': return <FileText {...iconProps} />;
      case 'health': return <CheckCircle2 {...iconProps} />;
      case 'utilities': return <Building2 {...iconProps} />;
      case 'travel': return <MapPin {...iconProps} />;
      case 'income': return <TrendingUp {...iconProps} />;
      default: return <Tag {...iconProps} />;
    }
  };

  const getStatusColor = () => {
    return transaction.type === 'DEBIT' 
      ? 'from-rose-500/10 via-indigo-500/5 to-slate-50'
      : transaction.type === 'CREDIT'
      ? 'from-emerald-500/10 via-emerald-500/5 to-slate-50'
      : 'from-sky-500/10 via-sky-500/5 to-slate-50';
  };

  const getStatusBadge = () => {
    return transaction.type === 'DEBIT'
      ? { text: 'Debited', color: 'bg-rose-50 text-rose-600 border-rose-100', icon: TrendingDown }
      : transaction.type === 'CREDIT'
      ? { text: 'Credited', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: TrendingUp }
      : { text: 'Transferred', color: 'bg-sky-50 text-sky-600 border-sky-100', icon: ArrowRightLeft };
  };

  const statusBadge = getStatusBadge();
  const StatusIcon = statusBadge.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md animate-fade-in sm:bg-slate-900/60" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal Card - Optimized height on mobile, centered on desktop */}
      <div 
        className="relative w-full sm:max-w-3xl bg-white rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up sm:my-auto max-h-[85vh] sm:max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Header - Ultra Compact */}
        <div className="relative px-4 sm:px-8 lg:px-12 pt-3 sm:pt-8 lg:pt-12 pb-2.5 sm:pb-6 border-b border-slate-100 shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 ${getTypeColor(transaction.type)}`}>
                {getTypeIcon(transaction.type)}
              </div>
              <div className="min-w-0 flex-1">
                <h3 id="modal-title" className="text-base sm:text-2xl font-black text-slate-900 tracking-tight truncate">
                  Payment Details
                </h3>
                <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5 hidden sm:block">
                  Complete financial record
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 sm:p-3 bg-slate-50 hover:bg-slate-100 rounded-xl sm:rounded-2xl transition-all text-slate-400 hover:text-slate-600 shrink-0 active:scale-95 touch-manipulation"
              aria-label="Close modal"
            >
              <X size={16} className="sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Main Content - Ultra Compact Mobile */}
        <div className="flex-1 overflow-y-auto hide-scrollbar px-4 sm:px-8 lg:px-12 py-2.5 sm:py-8 lg:py-12 space-y-2 sm:space-y-6 lg:space-y-8">
          {/* Hero Section - All Info Combined */}
          <div className={`relative overflow-hidden rounded-xl sm:rounded-[2rem] p-4 sm:p-6 lg:p-8 bg-gradient-to-br ${getStatusColor()} border-2 ${
            transaction.type === 'DEBIT' ? 'border-rose-100' 
            : transaction.type === 'CREDIT' ? 'border-emerald-100' 
            : 'border-sky-100'
          }`}>
            <div className="relative z-10 space-y-3 sm:space-y-4">
              {/* Top Row: Status & Amount */}
              <div className="flex items-center justify-between gap-3">
                <span className={`inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl border ${statusBadge.color} text-[9px] sm:text-xs font-black uppercase tracking-wider`}>
                  <StatusIcon size={11} className="sm:w-3.5 sm:h-3.5" />
                  {statusBadge.text}
                </span>
                <div className="text-right">
                  <p className={`text-2xl sm:text-4xl lg:text-5xl font-black leading-tight ${
                    transaction.type === 'DEBIT' 
                      ? 'text-slate-900' 
                      : transaction.type === 'CREDIT'
                      ? 'text-emerald-600'
                      : 'text-sky-600'
                  }`}>
                    {transaction.type === 'DEBIT' ? '-' : transaction.type === 'CREDIT' ? '+' : ''}
                    {formatINR(transaction.amount)}
                  </p>
                  <p className="text-[9px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">
                    {transaction.currency}
                  </p>
                </div>
              </div>

              {/* Merchant Info */}
              <div className="flex items-center gap-2 sm:gap-3">
                <MerchantLogoComponent
                  merchantName={transaction.merchant}
                  category={transaction.category}
                  size={40}
                  className="shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                    Store
                  </p>
                  <p className="text-sm sm:text-lg font-black text-slate-900 break-words">
                    {transaction.merchant}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                  <p className="text-[8px] sm:text-xs font-bold text-slate-500">
                    Verified
                  </p>
                </div>
              </div>

              {/* Date & Time */}
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/50 rounded-lg sm:rounded-xl flex items-center justify-center text-slate-700 shrink-0">
                  <Clock size={14} className="sm:w-5 sm:h-5" strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                    Date & Time
                  </p>
                  <p className="text-xs sm:text-base font-black text-slate-900">
                    {formatShortDate(transaction.date)} • {formatTime(transaction.date)}
                  </p>
                </div>
              </div>

              {/* Category & Payment Method - Same Row */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {/* Category */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/50 rounded-lg sm:rounded-xl flex items-center justify-center text-slate-700 shrink-0">
                    {getCategoryIcon(transaction.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                      Category
                    </p>
                    <span className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 bg-slate-900 text-white rounded-md sm:rounded-lg text-[9px] sm:text-xs font-black uppercase tracking-tighter">
                      {transaction.category}
                    </span>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/50 rounded-lg sm:rounded-xl flex items-center justify-center text-slate-700 shrink-0">
                    <CreditCard size={14} className="sm:w-5 sm:h-5" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                      Payment
                    </p>
                    <p className="text-xs sm:text-sm font-black text-slate-900 break-words truncate">
                      {transaction.source ? transaction.source.replace(/(\*{4}\d{4})\s+\1/g, '$1') : 'Not specified'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-24 h-24 sm:w-64 sm:h-64 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-xl sm:blur-3xl -translate-y-1/2 translate-x-1/2" />
          </div>


          {/* Transaction Notes / Raw Snippet - Ultra Compact */}
          {transaction.rawSnippet && (
            <div className="glass-card p-2.5 sm:p-6 lg:p-8 rounded-lg sm:rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-4">
                <div className="w-7 h-7 sm:w-10 sm:h-10 bg-slate-50 rounded-lg sm:rounded-xl flex items-center justify-center text-slate-600 shrink-0">
                  <FileText size={12} className="sm:w-[18px] sm:h-[18px]" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Notes
                  </p>
                </div>
              </div>
              <div className="pl-0 sm:pl-11 lg:pl-14">
                <p className="text-[10px] sm:text-sm font-medium text-slate-700 leading-relaxed break-words">
                  {transaction.rawSnippet}
                </p>
              </div>
            </div>
          )}

          {/* Transaction ID & Metadata - Ultra Compact */}
          <div className="glass-card p-2.5 sm:p-6 lg:p-8 rounded-lg sm:rounded-2xl border border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-4">
              <div className="w-7 h-7 sm:w-10 sm:h-10 bg-slate-100 rounded-lg sm:rounded-xl flex items-center justify-center text-slate-600 shrink-0">
                <Hash size={12} className="sm:w-[18px] sm:h-[18px]" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  More Details
                </p>
              </div>
            </div>
            <div className="pl-0 sm:pl-11 lg:pl-14 space-y-2 sm:space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-4 p-2 sm:p-4 bg-white rounded-lg sm:rounded-xl border border-slate-200">
                <div className="flex-1 min-w-0">
                  <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                    Reference ID
                  </p>
                  <code className="text-[8px] sm:text-xs font-mono text-slate-700 break-all block">
                    {transaction.id}
                  </code>
                </div>
                <button
                  onClick={handleCopyId}
                  className="p-1.5 sm:p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md sm:rounded-xl transition-all active:scale-95 shrink-0 touch-manipulation flex items-center justify-center gap-1 sm:gap-0"
                  aria-label="Copy reference ID"
                >
                  {copied ? (
                    <>
                      <Check size={12} className="sm:w-4 sm:h-4 text-emerald-400" />
                      <span className="text-[8px] sm:hidden font-bold">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} className="sm:w-4 sm:h-4" />
                      <span className="text-[8px] sm:hidden font-bold">Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div className="p-2 sm:p-4 bg-white rounded-lg sm:rounded-xl border border-slate-200">
                  <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                    Type
                  </p>
                  <p className="text-[10px] sm:text-sm font-black text-slate-900">
                    {transaction.type}
                  </p>
                </div>
                <div className="p-2 sm:p-4 bg-white rounded-lg sm:rounded-xl border border-slate-200">
                  <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                    Currency
                  </p>
                  <p className="text-[10px] sm:text-sm font-black text-slate-900">
                    {transaction.currency}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button - Ultra Compact */}
          <div className="pt-0.5 sm:pt-4 pb-2 sm:pb-0">
            <button 
              onClick={onClose}
              className="w-full h-10 sm:h-14 bg-slate-900 text-white rounded-lg sm:rounded-[1.5rem] text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-200 hover:bg-black transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 sm:gap-3 touch-manipulation"
              aria-label="Close"
            >
              <X size={14} className="sm:w-[18px] sm:h-[18px]" />
              <span className="hidden sm:inline">Close Details</span>
              <span className="sm:hidden">Close</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailsModal;
