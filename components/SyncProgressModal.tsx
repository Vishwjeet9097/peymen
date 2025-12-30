import React from 'react';
import { DownloadCloud, CheckCircle2, AlertTriangle, Sparkles, Mail, Database } from 'lucide-react';
import { SyncProgress } from '../types';

interface SyncProgressModalProps {
  isOpen: boolean;
  progress: SyncProgress;
  onClose?: () => void;
}

const SyncProgressModal: React.FC<SyncProgressModalProps> = ({ 
  isOpen, 
  progress,
  onClose 
}) => {
  if (!isOpen) return null;

  const percentage = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
  const isComplete = progress.status === 'completed';
  const isError = progress.status === 'error';
  const isProcessing = progress.status === 'processing';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={isComplete || isError ? onClose : undefined}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-slideUp">
        {/* Header */}
        <div className={`relative p-6 text-white ${
          isComplete ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
          isError ? 'bg-gradient-to-br from-red-500 to-rose-600' :
          'bg-gradient-to-br from-blue-500 to-indigo-600'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              {isComplete ? (
                <CheckCircle2 size={28} strokeWidth={2} />
              ) : isError ? (
                <AlertTriangle size={28} strokeWidth={2} />
              ) : (
                <DownloadCloud size={28} strokeWidth={2} className="animate-bounce" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {isComplete ? 'Sync Complete!' : isError ? 'Sync Failed' : 'Syncing Emails...'}
              </h2>
              <p className="text-white/90 text-sm mt-1">
                {isComplete ? 'All payments imported successfully' : 
                 isError ? 'Something went wrong' :
                 'Processing your payment emails'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Progress Stats */}
          {!isError && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                  <Mail size={16} strokeWidth={2} />
                  <span className="text-xs font-semibold uppercase tracking-wide">Total</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{progress.total}</p>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800">
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
                  <Sparkles size={16} strokeWidth={2} />
                  <span className="text-xs font-semibold uppercase tracking-wide">Processed</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{progress.current}</p>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-100 dark:border-green-800">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
                  <Database size={16} strokeWidth={2} />
                  <span className="text-xs font-semibold uppercase tracking-wide">Saved</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{progress.saved || 0}</p>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  Progress
                </span>
                <span className="text-blue-600 dark:text-blue-400 font-bold">
                  {percentage}%
                </span>
              </div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                  style={{ width: `${percentage}%` }}
                >
                  <div className="absolute inset-0 bg-white/30 animate-shimmer" />
                </div>
              </div>
            </div>
          )}

          {/* Status Message */}
          <div className={`p-4 rounded-xl border ${
            isComplete ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' :
            isError ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
            'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
          }`}>
            <p className={`text-sm font-medium ${
              isComplete ? 'text-green-800 dark:text-green-200' :
              isError ? 'text-red-800 dark:text-red-200' :
              'text-blue-800 dark:text-blue-200'
            }`}>
              {progress.message || 'Initializing...'}
            </p>
          </div>

          {/* Success Details */}
          {isComplete && progress.saved !== undefined && (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-750 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">New Payments</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {progress.saved}
                  </p>
                </div>
                <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <CheckCircle2 size={32} strokeWidth={2} className="text-green-600 dark:text-green-400" />
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                {progress.total - progress.saved} duplicates skipped
              </p>
            </div>
          )}

          {/* Error Details */}
          {isError && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-200">
                Please check your internet connection and API key, then try again.
              </p>
            </div>
          )}

          {/* Processing Animation */}
          {isProcessing && (
            <div className="flex items-center justify-center gap-2 py-4">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {(isComplete || isError) && onClose && (
          <div className="px-6 pb-6">
            <button
              onClick={onClose}
              className={`w-full px-4 py-3 rounded-xl font-semibold transition-all shadow-lg ${
                isComplete 
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-green-500/30'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/30'
              }`}
            >
              {isComplete ? 'View Payments' : 'Close'}
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default SyncProgressModal;
