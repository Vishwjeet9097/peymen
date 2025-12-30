import React, { useState } from 'react';
import { 
  ArrowRight,
  Mail,
  Shield,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

interface LoginScreenProps {
  onGoogleLogin: () => void;
  onGuestLogin: () => void;
  isLoading?: boolean;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ 
  onGoogleLogin, 
  onGuestLogin,
  isLoading = false 
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleGoogleLogin = () => {
    setIsAnimating(true);
    setTimeout(() => {
      onGoogleLogin();
      setIsAnimating(false);
    }, 200);
  };

  const handleGuestLogin = () => {
    setIsAnimating(true);
    setTimeout(() => {
      onGuestLogin();
      setIsAnimating(false);
    }, 200);
  };

  return (
    <div className="fixed inset-0 bg-white overflow-y-auto">
      {/* Status Bar Spacer */}
      <div className="h-safe-top bg-transparent" />

      <div className="flex flex-col min-h-full justify-between">
        {/* Main Content - Ultra Compact Layout */}
        <div className="flex flex-col items-center px-6 pt-[82px] pb-1">
          
          {/* Logo/Icon - Minimal Spacing */}
          <div className="mb-3">
            <img 
              src="/logo.png" 
              alt="Peymen Logo" 
              className="w-20 h-20 object-contain"
              style={{
                filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.12))',
              }}
            />
          </div>

          {/* Welcome Text - Tight Spacing */}
          <div className="text-center space-y-1 mb-6 max-w-sm">
            <h1 
              className="text-[26px] font-bold text-[#000000] leading-[32px] tracking-[-0.5px]"
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}
            >
              Welcome to <span style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                background: 'linear-gradient(135deg, rgb(79, 70, 229) 0%, rgb(124, 58, 237) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>Peymen</span> 
            </h1>
            <p 
              className="text-[14px] text-[#8E8E93] leading-[18px] font-normal"
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}
            >
              Your smart payment tracker that keeps your finances organized
            </p>
          </div>

          {/* Features List - Compact */}
          <div className="w-full max-w-sm space-y-1.5 mb-2">
            {[
              { icon: Mail, text: "Sync from Gmail automatically", color: "text-[#4F46E5]" },
              { icon: Shield, text: "100% private & secure", color: "text-emerald-600" },
              { icon: Sparkles, text: "AI-powered categorization", color: "text-purple-600" }
            ].map((feature, index) => (
              <div 
                key={index}
                className="flex items-center gap-2.5 p-2.5 bg-[#F9F9FB] rounded-[10px] transition-all hover:bg-[#F2F2F7]"
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}
              >
                <div className="w-7 h-7 rounded-[8px] bg-white flex items-center justify-center shadow-sm flex-shrink-0">
                  <feature.icon size={14} className={feature.color} strokeWidth={2} />
                </div>
                <span className="text-[13px] font-normal text-[#000000] flex-1">
                  {feature.text}
                </span>
                <CheckCircle2 size={12} className="text-emerald-500 flex-shrink-0" strokeWidth={2.5} />
              </div>
            ))}
          </div>
        </div>

        {/* Login Buttons Section - Minimal Bottom Spacing */}
        <div className="pb-safe-bottom px-6 pb-3 pt-0">
          <div className="max-w-sm w-full mx-auto space-y-2.5">
            {/* Google Login Button - Primary Action */}
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className={`group w-full h-[50px] rounded-[12px] flex items-center justify-between px-4 font-semibold text-white hover:opacity-90 active:scale-[0.98] transition-all duration-200 shadow-lg hover:shadow-xl ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              } ${isAnimating ? 'scale-95' : ''}`}
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                background: 'linear-gradient(135deg, rgb(79, 70, 229) 0%, rgb(124, 58, 237) 100%)',
              }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-md bg-gradient-to-br from-blue-500 to-red-500 flex items-center justify-center shadow-sm flex-shrink-0">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="white" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="white" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="white" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                <span className="text-[14px] font-semibold text-white">Continue with Google</span>
              </div>
              <ArrowRight size={15} className="text-white/90 group-hover:text-white transition-colors" strokeWidth={2.5} />
            </button>

            {/* Divider - Minimal */}
            <div className="flex items-center gap-2.5 py-0.5">
              <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-[#E5E5EA] to-transparent" />
              <span 
                className="text-[9px] font-medium text-[#8E8E93] uppercase tracking-[0.1em] px-2"
                style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}
              >
                OR
              </span>
              <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent via-[#E5E5EA] to-transparent" />
            </div>

            {/* Guest Login Button - Secondary Action */}
            <button
              onClick={handleGuestLogin}
              disabled={isLoading}
              className={`group w-full h-[50px] bg-gradient-to-br from-[#000000] to-[#1C1C1E] text-white rounded-[12px] flex items-center justify-between px-4 font-semibold hover:from-[#1C1C1E] hover:to-[#2C2C2E] active:scale-[0.98] transition-all duration-200 shadow-lg hover:shadow-xl ${
                isLoading ? 'opacity-50 cursor-not-allowed' : ''
              } ${isAnimating ? 'scale-95' : ''}`}
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}
            >
              <span className="text-[14px] font-semibold">Continue as Guest</span>
              <ArrowRight size={15} className="text-white/90 group-hover:text-white group-hover:translate-x-0.5 transition-all" strokeWidth={2.5} />
            </button>

            {/* Info Text - Minimal */}
            <p 
              className="text-[9px] text-center text-[#8E8E93] font-normal leading-relaxed pt-0.5"
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}
            >
              Guest mode uses sample data for demonstration
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
