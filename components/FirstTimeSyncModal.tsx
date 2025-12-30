import React from 'react';
import { 
  X, 
  Calendar, 
  RefreshCw, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface FirstTimeSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSync: () => void;
  onSkip: () => void;
}

const FirstTimeSyncModal: React.FC<FirstTimeSyncModalProps> = ({
  isOpen,
  onClose,
  onSync,
  onSkip
}) => {
  if (!isOpen) return null;

  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-IN', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}
    >
      <div 
        className="w-full max-w-md bg-white rounded-t-[28px] shadow-2xl overflow-hidden animate-slide-up"
        style={{ maxHeight: '90vh' }}
      >
        {/* Header - iOS Style */}
        <div className="relative bg-white p-6 border-b border-[#E5E5EA]">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 w-8 h-8 rounded-full bg-[#F2F2F7] hover:bg-[#E5E5EA] flex items-center justify-center transition-all active:scale-95"
            aria-label="Close"
          >
            <X size={16} className="text-[#000000]" />
          </button>
          
          <div className="pr-12">
            <h2 
              className="text-[22px] font-bold text-[#000000] leading-[28px] tracking-[-0.3px] mb-1"
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}
            >
              Sync Your Transactions
            </h2>
            <p 
              className="text-[15px] font-normal text-[#8E8E93]"
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}
            >
              Get started quickly
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {/* Info Card - iOS Style */}
          <div className="bg-[#F2F2F7] rounded-[14px] p-4">
            <div className="flex items-start gap-3">
              <Calendar size={20} className="text-[#007AFF] mt-0.5 shrink-0" />
              <div className="flex-1">
                <p 
                  className="text-[15px] font-semibold text-[#000000] mb-1"
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}
                >
                  Sync Today's Transactions
                </p>
                <p 
                  className="text-[13px] text-[#8E8E93] leading-[18px] font-normal"
                  style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}
                >
                  We'll import all payment emails from <strong className="text-[#000000]">{formattedDate}</strong> to get you started.
                </p>
              </div>
            </div>
          </div>

          {/* Benefits List - iOS Style */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#E8F5E9] flex items-center justify-center shrink-0">
                <CheckCircle2 size={16} className="text-[#34C759]" />
              </div>
              <p 
                className="text-[15px] font-normal text-[#000000]"
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}
              >
                Quick setup with today's data
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#E3F2FD] flex items-center justify-center shrink-0">
                <RefreshCw size={16} className="text-[#007AFF]" />
              </div>
              <p 
                className="text-[15px] font-normal text-[#000000]"
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}
              >
                You can sync more later anytime
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#F3E5F5] flex items-center justify-center shrink-0">
                <AlertCircle size={16} className="text-[#AF52DE]" />
              </div>
              <p 
                className="text-[15px] font-normal text-[#000000]"
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}
              >
                All data stays on your device
              </p>
            </div>
          </div>
        </div>

        {/* Actions - iOS Style */}
        <div className="px-6 pb-6 pt-4 space-y-3 border-t border-[#E5E5EA]">
          <button
            onClick={onSync}
            className="w-full h-14 bg-[#000000] text-white rounded-[14px] font-semibold flex items-center justify-center gap-2 hover:bg-[#1C1C1E] active:scale-[0.98] transition-all"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}
          >
            <RefreshCw size={18} />
            <span className="text-[17px]">Sync Today's Data</span>
          </button>
          
          <button
            onClick={onSkip}
            className="w-full h-14 bg-[#F2F2F7] text-[#000000] rounded-[14px] font-normal hover:bg-[#E5E5EA] active:scale-[0.98] transition-all"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}
          >
            <span className="text-[17px]">Skip for Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FirstTimeSyncModal;
