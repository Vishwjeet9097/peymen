import React, { useState, useEffect } from 'react';
import {
  Download,
  X,
  CheckCircle2,
  Smartphone,
  Monitor,
  Sparkles,
  Shield,
  Zap,
  ArrowRight,
  Star
} from 'lucide-react';
import { notificationService } from '../services/notifications';

interface InstallPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstall: () => void;
  deferredPrompt: any;
}

const InstallPromptModal: React.FC<InstallPromptModalProps> = ({
  isOpen,
  onClose,
  onInstall,
  deferredPrompt
}) => {
  const [isInstalling, setIsInstalling] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | 'unknown'>('unknown');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIOS = /iphone|ipad|ipod/.test(userAgent);
      const isAndroid = /android/.test(userAgent);
      const isMobile = isIOS || isAndroid;

      if (isIOS) {
        setPlatform('ios');
      } else if (isAndroid) {
        setPlatform('android');
      } else if (!isMobile) {
        setPlatform('desktop');
      } else {
        setPlatform('unknown');
      }
    }
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // Manual instructions are already shown in UI
      // User can follow the platform-specific instructions
      return;
    }

    setIsInstalling(true);
    try {
      // Show the install prompt
      deferredPrompt.prompt();

      // Wait for the user to respond
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        // User accepted the install prompt
        onInstall();
        onClose();
      } else {
        // User dismissed the install prompt
        setIsInstalling(false);
      }

      // Clear the deferredPrompt (it can only be used once)
      // Note: The parent component will handle clearing it
    } catch (error) {
      console.error('Install error:', error);
      setIsInstalling(false);
    }
  };

  const getInstallInstructions = () => {
    if (platform === 'ios') {
      return {
        title: 'Install on iOS',
        steps: [
          'Tap the Share button',
          'Scroll down and tap "Add to Home Screen"',
          'Tap "Add" in the top right corner'
        ]
      };
    } else if (platform === 'android') {
      return {
        title: 'Install on Android',
        steps: [
          'Tap the menu (⋮) in your browser',
          'Select "Add to Home Screen" or "Install App"',
          'Tap "Install" to confirm'
        ]
      };
    } else {
      return {
        title: 'Install on Desktop',
        steps: [
          'Click the install icon in your browser\'s address bar',
          'Or use the browser menu → "Install App"',
          'Follow the on-screen instructions'
        ]
      };
    }
  };

  if (!isOpen) return null;

  const instructions = getInstallInstructions();

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" 
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal Card - Mobile-friendly with scrollable content */}
      <div 
        className="relative w-full sm:max-w-md bg-white rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up sm:my-auto max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Fixed at top */}
        <div className="relative px-6 sm:px-8 pt-6 sm:pt-8 pb-4 border-b border-slate-100 shrink-0">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all active:scale-95 z-10"
            aria-label="Close"
          >
            <X size={18} strokeWidth={2.5} />
          </button>

          {/* App Icon & Header */}
          <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl overflow-hidden shadow-2xl">
              <img 
                src="/logo.png" 
                alt="Peymen" 
                className="w-full h-full object-cover"
              />
            </div>
            {/* Badge */}
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
              <CheckCircle2 size={16} className="text-white" strokeWidth={3} />
            </div>
          </div>

            <div className="space-y-2">
              <h2 id="install-modal-title" className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900">
                Install Peymen
              </h2>
              <p className="text-xs sm:text-sm md:text-base text-slate-600 font-medium">
                Get the full app experience on your device
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto hide-scrollbar px-6 sm:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
          {/* Benefits */}
          <div className="space-y-3">
          {[
            { icon: Zap, text: 'Faster access', color: 'text-amber-500' },
            { icon: Shield, text: 'Secure & private', color: 'text-emerald-500' },
            { icon: Sparkles, text: 'Works offline', color: 'text-purple-500' },
            { icon: Smartphone, text: 'Native app feel', color: 'text-indigo-500' }
          ].map((benefit, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm ${benefit.color}`}>
                <benefit.icon size={18} strokeWidth={2.5} />
              </div>
              <span className="text-sm font-bold text-slate-800 flex-1">
                {benefit.text}
              </span>
            </div>
          ))}
          </div>

          {/* Install Button or Instructions */}
          {deferredPrompt ? (
          <button
            onClick={handleInstall}
            disabled={isInstalling}
            className="w-full h-14 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white rounded-2xl font-black text-base uppercase tracking-wider flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isInstalling ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Installing...</span>
              </>
            ) : (
              <>
                <Download size={20} strokeWidth={2.5} />
                <span>Install Now</span>
                <ArrowRight size={18} strokeWidth={2.5} />
              </>
            )}
          </button>
          ) : (
            <div className="space-y-4">
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
              <h3 className="text-sm font-black text-indigo-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Monitor size={16} />
                {instructions.title}
              </h3>
              <ol className="space-y-2">
                {instructions.steps.map((step, index) => (
                  <li key={index} className="flex items-start gap-3 text-sm text-indigo-800 font-medium">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="flex-1 leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
            
            {/* Primary Install CTA Button */}
            <button
              onClick={() => {
                // Try to help user find install option
                if (platform === 'desktop') {
                  // For desktop, scroll to top to show address bar
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  // Show helpful notification
                  notificationService.add(
                    'info',
                    'Install Instructions',
                    'Look for the install icon (➕) in your browser\'s address bar, or check the browser menu (⋮ or ☰) for "Install App" option.',
                    true
                  );
                } else if (platform === 'android') {
                  // For Android, guide to menu
                  notificationService.add(
                    'info',
                    'Install Instructions',
                    'Tap the menu button (⋮) in your browser and look for "Add to Home Screen" or "Install App" option.',
                    true
                  );
                } else if (platform === 'ios') {
                  // For iOS, guide to share button
                  notificationService.add(
                    'info',
                    'Install Instructions',
                    'Tap the Share button (square with arrow) at the bottom, then scroll and tap "Add to Home Screen".',
                    true
                  );
                }
              }}
              className="w-full h-14 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white rounded-2xl font-black text-base uppercase tracking-wider flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl transition-all active:scale-95"
            >
              <Download size={20} strokeWidth={2.5} />
              <span>Install App</span>
              <ArrowRight size={18} strokeWidth={2.5} />
            </button>
            
            {/* Secondary Close Button */}
            <button
              onClick={onClose}
              className="w-full h-12 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all active:scale-95"
            >
              I'll do it later
            </button>
            </div>
          )}
        </div>

        {/* Trust Indicators - Fixed at bottom */}
        <div className="px-6 sm:px-8 py-4 border-t border-slate-100 shrink-0">
          <div className="flex items-center justify-center gap-4 sm:gap-6">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Shield size={14} strokeWidth={2} />
              <span className="font-bold">Secure</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Star size={14} strokeWidth={2} className="fill-amber-400 text-amber-400" />
              <span className="font-bold">Trusted</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <CheckCircle2 size={14} strokeWidth={2} />
              <span className="font-bold">Verified</span>
            </div>
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

export default InstallPromptModal;
