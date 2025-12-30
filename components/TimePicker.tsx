import React, { useState, useRef, useEffect } from 'react';
import { Clock, ChevronUp, ChevronDown, CheckCircle2 } from 'lucide-react';

interface TimePickerProps {
  value: string; // Format: "HH:MM" (24-hour) or "HH:MM AM/PM"
  onChange: (time: string) => void;
  className?: string;
}

const TimePicker: React.FC<TimePickerProps> = ({ value, onChange, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedHour, setSelectedHour] = useState<number>(7);
  const [selectedMinute, setSelectedMinute] = useState<number>(0);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM');
  const pickerRef = useRef<HTMLDivElement>(null);
  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);

  // Parse initial value
  useEffect(() => {
    if (value) {
      const [hours, minutes] = value.split(':').map(Number);
      if (hours >= 12) {
        setSelectedPeriod('PM');
        setSelectedHour(hours === 12 ? 12 : hours - 12);
      } else {
        setSelectedPeriod('AM');
        setSelectedHour(hours === 0 ? 12 : hours);
      }
      setSelectedMinute(minutes || 0);
    }
  }, [value]);

  // Convert to 24-hour format for onChange
  const formatTime = (hour: number, minute: number, period: 'AM' | 'PM'): string => {
    let hour24 = hour;
    if (period === 'PM' && hour !== 12) {
      hour24 = hour + 12;
    } else if (period === 'AM' && hour === 12) {
      hour24 = 0;
    }
    return `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  // Display format
  const displayTime = (hour: number, minute: number, period: 'AM' | 'PM'): string => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const handleTimeChange = (hour: number, minute: number, period: 'AM' | 'PM') => {
    setSelectedHour(hour);
    setSelectedMinute(minute);
    setSelectedPeriod(period);
    onChange(formatTime(hour, minute, period));
  };

  // Scroll to selected item when modal opens - Make numbers visible immediately
  useEffect(() => {
    if (isOpen) {
      // Use a longer timeout to ensure DOM is ready
      setTimeout(() => {
        if (hourRef.current) {
          const hourElement = hourRef.current.querySelector(`[data-hour="${selectedHour}"]`);
          if (hourElement) {
            hourElement.scrollIntoView({ behavior: 'auto', block: 'center' });
          }
        }
        if (minuteRef.current) {
          const minuteElement = minuteRef.current.querySelector(`[data-minute="${selectedMinute}"]`);
          if (minuteElement) {
            minuteElement.scrollIntoView({ behavior: 'auto', block: 'center' });
          }
        }
      }, 150);
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  return (
    <div className={`relative ${className}`} ref={pickerRef}>
      {/* Time Display Button - Enhanced with Theme Colors */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-gradient-to-r from-[var(--brand-primary)]/5 to-[var(--brand-accent)]/5 border-2 border-[var(--brand-primary)]/20 rounded-lg md:rounded-xl h-11 md:h-12 px-3 md:px-4 text-xs font-black text-slate-700 focus:ring-2 focus:ring-[var(--brand-primary)]/30 transition-all flex items-center justify-between hover:from-[var(--brand-primary)]/10 hover:to-[var(--brand-accent)]/10 hover:border-[var(--brand-primary)]/30 active:scale-95 shadow-sm"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[var(--brand-primary)]/10 flex items-center justify-center">
            <Clock size={12} className="text-[var(--brand-primary)]" />
          </div>
          <span className="font-black">{displayTime(selectedHour, selectedMinute, selectedPeriod)}</span>
        </div>
        <ChevronDown size={14} className={`text-[var(--brand-primary)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Time Picker Modal - Full Screen like AddTransactionModal */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md animate-fade-in"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Modal Card - Full Width without margins */}
          <div
            className="relative w-full bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden animate-slide-up sm:my-auto max-h-[90vh] flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="time-picker-title"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - Enhanced with Theme Colors */}
            <div className="relative px-6 sm:px-8 pt-6 sm:pt-8 pb-4 border-b border-slate-100 shrink-0 bg-gradient-to-br from-[var(--brand-primary)]/5 via-[var(--brand-accent)]/5 to-[var(--brand-blue)]/5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-accent)] rounded-2xl flex items-center justify-center shadow-lg shadow-[var(--brand-primary)]/20">
                    <Clock size={22} className="text-white" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 id="time-picker-title" className="text-lg font-black text-slate-900">
                      Select Time
                    </h3>
                    <p className="text-[10px] font-bold text-[var(--brand-primary)] uppercase tracking-widest">
                      Choose sync time
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 bg-white/80 hover:bg-white rounded-xl transition-all text-slate-400 hover:text-slate-600 hover:scale-110 active:scale-95 shadow-sm"
                  aria-label="Close time picker"
                >
                  <span className="text-slate-600 font-black text-xl leading-none">×</span>
                </button>
              </div>
              {/* Current Selection Display - Enhanced */}
              <div className="text-center py-5 bg-gradient-to-br from-[var(--brand-primary)] via-[var(--brand-accent)] to-[var(--brand-blue)] rounded-2xl shadow-xl shadow-[var(--brand-primary)]/20 border-2 border-white/50 relative overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
                
                <div className="relative z-10">
                  <div className="text-4xl md:text-5xl font-black text-white mb-2 drop-shadow-lg">
                    {displayTime(selectedHour, selectedMinute, selectedPeriod)}
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-white/80 animate-pulse" />
                    <p className="text-[10px] font-bold text-white/90 uppercase tracking-widest">
                      Current Selection
                    </p>
                    <div className="w-2 h-2 rounded-full bg-white/80 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>

            {/* Time Selector - Enhanced with Theme Colors - Full Width */}
            <div className="flex-1 overflow-y-auto hide-scrollbar bg-gradient-to-br from-slate-50 via-white to-slate-50">
              <div className="flex items-center justify-center gap-2 md:gap-3 w-full px-2 md:px-4 py-4">
              {/* Hours Column */}
              <div className="flex-1 min-w-0">
                <div className="text-center mb-2">
                  <label className="text-[9px] font-black text-[var(--brand-primary)] uppercase tracking-widest bg-[var(--brand-primary)]/10 px-2 py-1 rounded-full inline-block">Hour</label>
                </div>
                <div className="relative h-64 overflow-hidden rounded-2xl bg-white">
                  {/* Selection Indicator - Transparent background so text is visible */}
                  <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-16 border-y-2 border-[var(--brand-primary)] pointer-events-none rounded-lg z-10" />
                  {/* Top fade - Very subtle */}
                  <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-white/50 to-transparent pointer-events-none z-5" />
                  {/* Bottom fade - Very subtle */}
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white/50 to-transparent pointer-events-none z-5" />
                  
                  <div
                    ref={hourRef}
                    className="h-full overflow-y-auto scroll-smooth hide-scrollbar relative z-0"
                    style={{ scrollSnapType: 'y mandatory' }}
                  >
                    {/* Padding for first item - Reduced to show more numbers */}
                    <div className="h-16" />
                    {hours.map((hour) => (
                      <button
                        key={hour}
                        data-hour={hour}
                        onClick={() => {
                          handleTimeChange(hour, selectedMinute, selectedPeriod);
                          // Scroll to center
                          setTimeout(() => {
                            const element = hourRef.current?.querySelector(`[data-hour="${hour}"]`);
                            element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }, 50);
                        }}
                        className={`w-full py-5 text-center transition-all scroll-snap-align-center relative z-20 ${
                          selectedHour === hour
                            ? 'text-[var(--brand-primary)] font-black text-2xl scale-110'
                            : 'text-slate-600 font-bold text-lg hover:text-[var(--brand-primary)]/70'
                        }`}
                        style={{ scrollSnapAlign: 'center' }}
                      >
                        {hour.toString().padStart(2, '0')}
                      </button>
                    ))}
                    {/* Padding for last item - Reduced to show more numbers */}
                    <div className="h-16" />
                  </div>
                </div>
              </div>

              {/* Separator - Enhanced */}
              <div className="flex flex-col items-center justify-center py-12 px-0.5">
                <div className="w-0.5 h-12 bg-gradient-to-b from-[var(--brand-primary)] via-[var(--brand-accent)] to-[var(--brand-primary)] rounded-full opacity-30" />
                <div className="text-3xl md:text-4xl font-black text-[var(--brand-primary)] py-2">:</div>
                <div className="w-0.5 h-12 bg-gradient-to-b from-[var(--brand-primary)] via-[var(--brand-accent)] to-[var(--brand-primary)] rounded-full opacity-30" />
              </div>

              {/* Minutes Column */}
              <div className="flex-1 min-w-0">
                <div className="text-center mb-2">
                  <label className="text-[9px] font-black text-[var(--brand-primary)] uppercase tracking-widest bg-[var(--brand-primary)]/10 px-2 py-1 rounded-full inline-block">Minute</label>
                </div>
                <div className="relative h-64 overflow-hidden rounded-2xl bg-white">
                  {/* Selection Indicator - Transparent background so text is visible */}
                  <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-16 border-y-2 border-[var(--brand-primary)] pointer-events-none rounded-lg z-10" />
                  {/* Top fade - Very subtle */}
                  <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-white/50 to-transparent pointer-events-none z-5" />
                  {/* Bottom fade - Very subtle */}
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white/50 to-transparent pointer-events-none z-5" />
                  
                  <div
                    ref={minuteRef}
                    className="h-full overflow-y-auto scroll-smooth hide-scrollbar relative z-0"
                    style={{ scrollSnapType: 'y mandatory' }}
                  >
                    {/* Padding for first item - Reduced to show more numbers */}
                    <div className="h-16" />
                    {minutes.map((minute) => (
                      <button
                        key={minute}
                        data-minute={minute}
                        onClick={() => {
                          handleTimeChange(selectedHour, minute, selectedPeriod);
                          // Scroll to center
                          setTimeout(() => {
                            const element = minuteRef.current?.querySelector(`[data-minute="${minute}"]`);
                            element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }, 50);
                        }}
                        className={`w-full py-5 text-center transition-all scroll-snap-align-center relative z-20 ${
                          selectedMinute === minute
                            ? 'text-[var(--brand-primary)] font-black text-2xl scale-110'
                            : 'text-slate-600 font-bold text-lg hover:text-[var(--brand-primary)]/70'
                        }`}
                        style={{ scrollSnapAlign: 'center' }}
                      >
                        {minute.toString().padStart(2, '0')}
                      </button>
                    ))}
                    {/* Padding for last item - Reduced to show more numbers */}
                    <div className="h-16" />
                  </div>
                </div>
              </div>

              {/* AM/PM Column - Enhanced */}
              <div className="flex-1 min-w-0">
                <div className="text-center mb-2">
                  <label className="text-[9px] font-black text-[var(--brand-primary)] uppercase tracking-widest bg-[var(--brand-primary)]/10 px-2 py-1 rounded-full inline-block">Period</label>
                </div>
                <div className="h-64 flex flex-col items-center justify-center gap-3 bg-white rounded-2xl p-2 md:p-3">
                  {(['AM', 'PM'] as const).map((period) => (
                    <button
                      key={period}
                      onClick={() => handleTimeChange(selectedHour, selectedMinute, period)}
                      className={`w-full py-6 rounded-xl font-black text-sm transition-all relative overflow-hidden ${
                        selectedPeriod === period
                          ? 'bg-gradient-to-br from-[var(--brand-primary)] via-[var(--brand-accent)] to-[var(--brand-primary)] text-white scale-105'
                          : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border-2 border-slate-200 hover:border-[var(--brand-primary)]/30'
                      }`}
                    >
                      {selectedPeriod === period && (
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
                      )}
                      <span className="relative z-10">{period}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            </div>

            {/* Footer Actions - Enhanced with Theme Colors */}
            <div className="p-4 sm:p-6 border-t border-slate-100 bg-gradient-to-r from-white via-slate-50/50 to-white shrink-0 flex gap-3">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-3.5 bg-white border-2 border-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95 shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-3.5 bg-gradient-to-r from-[var(--brand-primary)] via-[var(--brand-accent)] to-[var(--brand-primary)] text-white rounded-xl text-xs font-black uppercase tracking-wider hover:shadow-xl shadow-lg shadow-[var(--brand-primary)]/30 transition-all active:scale-95 relative overflow-hidden group"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <CheckCircle2 size={14} />
                  Confirm
                </span>
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </div>
        </div>
      )}

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
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default TimePicker;
