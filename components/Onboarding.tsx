import React, { useState, useRef } from 'react';
import { ArrowRight, IndianRupee } from 'lucide-react';

interface OnboardingProps {
  onGetStarted: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onGetStarted }) => {
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const card1 = {
    bg: "bg-gradient-to-br from-slate-900 via-slate-800 to-black",
    accent: "from-pink-500/30 via-magenta-500/20 to-transparent",
    network: "VISA",
    number: "4242",
    cardholder: "EISHA KHANNA",
    monthlySpent: "₹13033.00",
    payments: "3 payments",
    validThru: "09/26",
    bankName: "AXIS BANK"
  };

  const card2 = {
    bg: "bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900",
    accent: "from-indigo-400/20 to-transparent",
    network: "AMEX",
    number: "7891",
    cardholder: "JOHN SMITH",
    monthlySpent: "₹465.99",
    payments: "2 payments",
    validThru: "12/25",
    bankName: "PREMIUM CARD"
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    // Touch handling for future swipe gestures if needed
    // Currently not used as we have single slide
  };

  const CardComponent = ({ card, isTop, rotation, left }: { card: any; isTop: boolean; rotation: string; left?: string }) => (
    <div 
      className={`absolute w-[320px] h-[200px] rounded-[24px] ${card.bg} transition-all duration-700 ease-out overflow-hidden relative group`}
      style={{
        [isTop ? 'top' : 'bottom']: '10px',
        left: left || '50%',
        transform: `translateX(-50%) ${isTop ? 'translateY(-7px)' : 'translateY(15px)'} ${rotation}`,
        zIndex: isTop ? 2 : 1,
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
      }}
    >
      {/* Decorative Background Elements */}
      <div className={`absolute inset-0 bg-gradient-to-br ${card.accent} opacity-50`} />
      
      {/* Card Content */}
      <div className="relative z-10 h-full flex flex-col justify-between p-4">
        {/* Top Section - Bank Logo & Contactless */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-sm">
              <p className="text-[9px] font-black uppercase tracking-wider text-white">
                {card.bankName}
              </p>
            </div>
          </div>
          {/* Contactless Symbol */}
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center">
              <div className="flex gap-0.5">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-0.5 bg-white/40 rounded-full" style={{ height: `${1.5 + i * 0.3}px` }} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Middle Section - Card Number & Chip */}
        <div className="flex-1 flex flex-col justify-center space-y-3">
          {/* EMV Chip */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-yellow-400 rounded-md flex items-center justify-center shadow-lg">
              <div className="w-6 h-6 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-sm flex items-center justify-center">
                <div className="grid grid-cols-4 gap-0.5 w-4 h-4">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} className="w-0.5 h-0.5 bg-slate-800 rounded-full" />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Card Number */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {[1, 2, 3].map(i => (
                <span key={i} className="text-sm font-mono tracking-widest text-white">••••</span>
              ))}
              <span className="text-sm font-mono font-black tracking-widest text-white">
                {card.number}
              </span>
            </div>
            <p className="text-[8px] font-bold text-white/60 uppercase tracking-widest">
              {card.bankName}
            </p>
          </div>
        </div>

        {/* Bottom Section - Cardholder, Valid Thru, Network */}
        <div className="flex items-end justify-between">
          <div className="flex-1">
            <p className="text-[7px] font-bold text-white/60 uppercase tracking-widest mb-0.5">
              Cardholder
            </p>
            <p className="text-xs font-black uppercase tracking-wider truncate text-white">
              {card.cardholder}
            </p>
          </div>
          
          <div className="flex items-end gap-4">
            <div className="text-right">
              <p className="text-[7px] font-bold text-white/60 uppercase tracking-widest mb-0.5">
                Valid Thru
              </p>
              <p className="text-xs font-black text-white">{card.validThru}</p>
            </div>
            
            {/* Network Logo */}
            <div className="px-2 py-1.5 rounded-md bg-white/10 backdrop-blur-sm">
              <p className="text-[8px] font-black uppercase tracking-wider text-white">
                {card.network}
              </p>
            </div>
          </div>
        </div>

        {/* Monthly Spend - Professional Display */}
        <div className="absolute top-4 right-4 text-right">
          <p className="text-[7px] font-bold text-white/70 uppercase tracking-widest mb-0.5">
            Monthly Spent
          </p>
          <p className="text-sm font-black leading-tight text-white">
            {card.monthlySpent}
          </p>
          <p className="text-[7px] font-bold text-white/60 mt-0.5">
            {card.payments}
          </p>
        </div>
      </div>

      {/* Indian Rupee Watermark - Right Side */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-10">
        <IndianRupee 
          size={140} 
          strokeWidth={1.5}
          className="text-white"
        />
      </div>
    </div>
  );

  return (
    <div 
      className="fixed inset-0 bg-white overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}
    >
      {/* Status Bar Spacer */}
      <div className="h-safe-top bg-transparent" />

      <div className="flex flex-col h-full max-h-screen">
        
        {/* Brand Name - Top Left */}
        <div className="absolute top-2 left-6 z-30">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] bg-clip-text">
              <h1 
                className="text-[24px] font-extrabold tracking-tighter text-transparent"
                style={{ 
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  backgroundImage: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Peymen
              </h1>
            </div>
          </div>
        </div>

        {/* Skip Button - Top Right - Enhanced */}
        <div className="absolute top-2 right-4 z-30">
          <button
            onClick={onGetStarted}
            className="px-4 py-2 rounded-[10px] text-[15px] font-semibold text-[#4F46E5] bg-[#4F46E5]/10 hover:bg-[#4F46E5]/20 active:scale-95 transition-all duration-200 border border-[#4F46E5]/20 hover:border-[#4F46E5]/30"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif' }}
          >
            Skip
          </button>
        </div>

        {/* Main Content - Centered */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 relative overflow-visible pt-8">
          
          {/* Overlapping Cards - Single Slide */}
          <div className="relative  my-7 h-[230px] flex items-center justify-center">
            <CardComponent 
              card={card2} 
              isTop={false} 
              rotation="rotate(0deg)"
              left="50%"
            />
            <CardComponent 
              card={card1} 
              isTop={true} 
              rotation="rotate(-8deg)"
              left="0%"
            />
          </div>

          {/* Text Content */}
          <div className="text-center space-y-6 mb-10 w-full max-w-sm px-4">
            <h1 
              className="text-[36px] font-bold text-[#000000] leading-[42px] tracking-[-0.6px]"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 700,
              }}
            >
              Effortless Payment Tracking
            </h1>
            
            <p 
              className="text-[17px] text-[#8E8E93] leading-[24px] font-normal max-w-[340px] mx-auto"
              style={{ 
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 400,
              }}
            >
              Automatically sync transactions from Gmail and keep everything organized in one place.
            </p>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pb-safe-bottom px-6 pb-10">
          {/* Get Started Button */}
          <button
            onClick={onGetStarted}
            className="w-full h-14 text-white rounded-[14px] flex items-center justify-center gap-2 font-semibold hover:opacity-90 active:scale-[0.98] transition-all shadow-lg hover:shadow-xl"
            style={{ 
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              fontSize: '17px',
              fontWeight: 600,
              background: 'linear-gradient(135deg, rgb(79, 70, 229) 0%, rgb(124, 58, 237) 100%)',
            }}
          >
            <span>Get started</span>
            <ArrowRight size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
