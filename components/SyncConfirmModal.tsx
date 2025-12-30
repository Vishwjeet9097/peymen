import React, { useState } from 'react';
import { DownloadCloud, Sparkles, X, Calendar, Clock } from 'lucide-react';

interface SyncConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (days: number, customStartDate?: Date, customEndDate?: Date) => void;
  isProcessing?: boolean;
}

type SyncPeriod = 'today' | '3days' | 'week' | '15days' | '30days' | '45days' | '90days' | 'custom';

const SyncConfirmModal: React.FC<SyncConfirmModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  isProcessing = false 
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<SyncPeriod>('30days');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedPeriod === 'custom') {
      if (!customStartDate || !customEndDate) {
        alert('Please select both start and end dates for custom range.');
        return;
      }
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff < 0) {
        alert('End date must be after start date.');
        return;
      }
      onConfirm(daysDiff + 1, start, end); // +1 to include both dates
    } else {
      onConfirm(getDaysFromPeriod(selectedPeriod));
    }
  };

  const getDaysFromPeriod = (period: SyncPeriod): number => {
    switch (period) {
      case 'today': return 1;
      case '3days': return 3;
      case 'week': return 7;
      case '15days': return 15;
      case '30days': return 30;
      case '45days': return 45;
      case '90days': return 90;
      default: return 30;
    }
  };

  const getPeriodLabel = (period: SyncPeriod): string => {
    switch (period) {
      case 'today': return 'Today';
      case '3days': return 'Last 3 Days';
      case 'week': return 'Last Week';
      case '15days': return 'Last 15 Days';
      case '30days': return 'Last 30 Days';
      case '45days': return 'Last 45 Days';
      case '90days': return 'Last 90 Days';
      case 'custom': return 'Custom Range';
      default: return 'Last 30 Days';
    }
  };

  const getEstimatedEmails = (period: SyncPeriod): string => {
    const days = getDaysFromPeriod(period);
    if (days === 1) return '~5-10';
    if (days <= 3) return '~15-30';
    if (days <= 7) return '~50';
    if (days <= 15) return '~100';
    if (days <= 30) return '~200';
    if (days <= 45) return '~300';
    return '~600';
  };

  const periodOptions: { value: SyncPeriod; label: string; icon?: string }[] = [
    { value: 'today', label: 'Today' },
    { value: '3days', label: '3 Days' },
    { value: 'week', label: 'Week' },
    { value: '15days', label: '15 Days' },
    { value: '30days', label: '30 Days' },
    { value: '45days', label: '45 Days' },
    { value: '90days', label: '90 Days' },
    { value: 'custom', label: 'Custom' },
  ];

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center overflow-y-auto">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md animate-fadeIn"
          onClick={isProcessing ? undefined : onClose}
          aria-hidden="true"
        />
        
        {/* Modal - Full Screen on Mobile, Centered on Desktop */}
        <div className="relative bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl w-full sm:max-w-lg overflow-hidden animate-slideUp border border-slate-100 max-h-[90vh] flex flex-col">
        {/* Header - Enhanced */}
        <div className="relative px-6 sm:px-8 pt-6 sm:pt-8 pb-4 border-b border-slate-100 shrink-0 bg-gradient-to-br from-[var(--brand-primary)]/5 via-[var(--brand-accent)]/5 to-[var(--brand-blue)]/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-accent)] rounded-2xl flex items-center justify-center shadow-lg shadow-[var(--brand-primary)]/20">
                <DownloadCloud size={22} className="text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  Sync Gmail Payments
                </h2>
                <p className="text-[10px] font-bold text-[var(--brand-primary)] uppercase tracking-widest">
                  Select time period
                </p>
              </div>
            </div>
            {!isProcessing && (
              <button
                onClick={onClose}
                className="p-2 bg-white/80 hover:bg-white rounded-xl transition-all text-slate-400 hover:text-slate-600 hover:scale-110 active:scale-95 shadow-sm"
                aria-label="Close modal"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            )}
          </div>
          <p className="text-[11px] font-bold text-slate-600 leading-relaxed">
            Choose a time period to sync. AI will analyze emails to extract payment data.
          </p>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto hide-scrollbar p-6 sm:p-8">

          {/* Period Selection - Enhanced */}
          <div className="mb-6 space-y-4">
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-[var(--brand-primary)]/10 rounded-lg flex items-center justify-center">
                <Calendar size={12} className="text-[var(--brand-primary)]" />
              </div>
              Select Sync Period
            </label>
            
            {/* Quick Period Options - Scrollable on Mobile */}
            <div className="overflow-x-auto hide-scrollbar -mx-6 sm:mx-0 px-6 sm:px-0">
              <div className="flex sm:grid sm:grid-cols-4 gap-3 min-w-max sm:min-w-0">
                {periodOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSelectedPeriod(option.value);
                      if (option.value !== 'custom') {
                        setCustomStartDate('');
                        setCustomEndDate('');
                      }
                    }}
                    disabled={isProcessing}
                    className={`group relative flex-shrink-0 w-24 sm:w-full p-4 sm:p-5 rounded-2xl border-2 transition-all active:scale-95 overflow-hidden ${
                      selectedPeriod === option.value
                        ? 'bg-gradient-to-br from-[var(--brand-primary)] via-[var(--brand-accent)] to-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-xl shadow-[var(--brand-primary)]/30'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-[var(--brand-primary)]/30 hover:bg-slate-50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {selectedPeriod === option.value && (
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
                    )}
                    <div className="relative z-10 flex flex-col items-center gap-2">
                      <Calendar 
                        size={16} 
                        strokeWidth={2.5}
                        className={selectedPeriod === option.value ? 'text-white' : 'text-[var(--brand-primary)]'}
                      />
                      <span className={`text-[10px] font-black uppercase tracking-wider ${
                        selectedPeriod === option.value 
                          ? 'text-white' 
                          : 'text-slate-700'
                      }`}>
                        {option.label}
                      </span>
                      {option.value !== 'custom' && (
                        <span className={`text-[9px] font-bold ${
                          selectedPeriod === option.value ? 'text-white/80' : 'text-slate-500'
                        }`}>
                          ~{getEstimatedEmails(option.value)} emails
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Date Range - Enhanced */}
            {selectedPeriod === 'custom' && (
              <div className="mt-4 p-4 md:p-5 bg-gradient-to-r from-[var(--brand-primary)]/10 via-[var(--brand-accent)]/10 to-[var(--brand-primary)]/10 rounded-2xl border border-[var(--brand-primary)]/20 space-y-4 animate-slideUp">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-[var(--brand-primary)]/20 rounded-xl flex items-center justify-center">
                    <Clock size={16} className="text-[var(--brand-primary)]" />
                  </div>
                  <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider">Custom Date Range</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      max={customEndDate || new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2.5 text-xs border-2 border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-[var(--brand-primary)]/30 focus:border-[var(--brand-primary)] transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      min={customStartDate}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2.5 text-xs border-2 border-slate-200 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-[var(--brand-primary)]/30 focus:border-[var(--brand-primary)] transition-all"
                    />
                  </div>
                </div>
                {customStartDate && customEndDate && (
                  <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200">
                    <Clock size={14} className="text-[var(--brand-primary)]" />
                    <span className="text-[10px] font-bold text-slate-700">
                      <span className="font-black">Range:</span> {Math.ceil((new Date(customEndDate).getTime() - new Date(customStartDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} days
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Selected Period Info - Enhanced */}
            {selectedPeriod !== 'custom' && (
              <div className="relative overflow-hidden bg-gradient-to-br from-[var(--brand-primary)] via-[var(--brand-accent)] to-[var(--brand-primary)] rounded-2xl border-2 border-white/20 shadow-xl shadow-[var(--brand-primary)]/20">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full blur-xl translate-y-1/2 -translate-x-1/2" />
                
                <div className="relative z-10 flex items-center gap-4 p-5">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/30 shadow-lg">
                    <Clock size={20} className="text-white" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-black text-white uppercase tracking-wider mb-1">
                      {getPeriodLabel(selectedPeriod)}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" />
                      <p className="text-[11px] font-bold text-white/90">
                        Estimated: {getEstimatedEmails(selectedPeriod)} emails
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Custom Date Range Info */}
            {selectedPeriod === 'custom' && customStartDate && customEndDate && (
              <div className="relative overflow-hidden bg-gradient-to-br from-[var(--brand-primary)] via-[var(--brand-accent)] to-[var(--brand-primary)] rounded-2xl border-2 border-white/20 shadow-xl shadow-[var(--brand-primary)]/20">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full blur-xl translate-y-1/2 -translate-x-1/2" />
                
                <div className="relative z-10 flex items-center gap-4 p-5">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/30 shadow-lg">
                    <Calendar size={20} className="text-white" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-black text-white uppercase tracking-wider mb-1">
                      Custom Range
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" />
                      <p className="text-[11px] font-bold text-white/90">
                        {Math.ceil((new Date(customEndDate).getTime() - new Date(customStartDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} days selected
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Info Badge - Enhanced */}
          <div className="flex justify-center mb-6">
            <div className="relative overflow-hidden inline-flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r from-[var(--brand-primary)]/10 via-[var(--brand-accent)]/10 to-[var(--brand-primary)]/10 rounded-2xl border-2 border-[var(--brand-primary)]/30 shadow-lg backdrop-blur-sm">
              {/* Decorative glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--brand-primary)]/20 to-transparent opacity-50" />
              
              <div className="relative z-10 w-10 h-10 bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-accent)] rounded-xl flex items-center justify-center shadow-md">
                <Sparkles size={18} strokeWidth={2.5} className="text-white" />
              </div>
              <div>
                <p className="text-[11px] font-black text-[var(--brand-primary)] uppercase tracking-wider">
                  Bulk AI Processing
                </p>
                <p className="text-[9px] font-bold text-slate-600">
                  Powered by Gemini AI
                </p>
              </div>
            </div>
          </div>
        </div>

          {/* Actions - Enhanced Footer */}
          <div className="p-4 sm:p-6 border-t border-slate-100 bg-gradient-to-br from-white via-slate-50/30 to-white shrink-0 flex gap-3">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 px-4 py-4 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-slate-50 hover:border-slate-300 hover:shadow-md transition-all active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isProcessing}
              className="flex-1 px-4 py-4 bg-gradient-to-r from-[var(--brand-primary)] via-[var(--brand-accent)] to-[var(--brand-primary)] text-white rounded-2xl text-xs font-black uppercase tracking-wider hover:shadow-2xl shadow-xl shadow-[var(--brand-primary)]/40 transition-all active:scale-95 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {/* Decorative glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              {isProcessing ? (
                <>
                  <div className="relative z-10 w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="relative z-10">Starting...</span>
                </>
              ) : (
                <>
                  <DownloadCloud size={18} className="relative z-10" strokeWidth={2.5} />
                  <span className="relative z-10">Start Sync</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  );
};

export default SyncConfirmModal;
