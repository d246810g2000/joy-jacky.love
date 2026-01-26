
import React, { useState, useEffect } from 'react';
import { APP_CONTENT } from '../constants';
import { motion } from 'framer-motion';

export const WeddingCalendar: React.FC = () => {
  // Countdown Logic
  const calculateTimeLeft = () => {
    const difference = +new Date(APP_CONTENT.dateISO) - +new Date();
    let timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearTimeout(timer);
  });

  // Calendar Logic for May 2026
  // May 1st, 2026 is a Friday. 
  // Days: 31
  // Grid padding: 5 empty slots (Sun, Mon, Tue, Wed, Thu) before Friday.
  const daysInMonth = 31;
  const startingDay = 5; // 0=Sun, 5=Fri
  const weddingDay = 30;

  const calendarDays = [];
  // Add empty slots
  for (let i = 0; i < startingDay; i++) {
    calendarDays.push(null);
  }
  // Add actual days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const TimerUnit = ({ value, label }: { value: number, label: string }) => (
    <div className="flex flex-col items-center">
      <span className="font-serif text-2xl md:text-3xl text-[#8E3535] font-medium tabular-nums">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[10px] text-[#b08d55] uppercase tracking-widest mt-1">
        {label}
      </span>
    </div>
  );

  return (
    <div className="w-full flex justify-center pb-20 px-4 md:px-0">
      <div className="bg-white max-w-lg w-full rounded-sm shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] border border-stone-100 p-8 md:p-12 text-center relative overflow-hidden">
        
        {/* Decorative Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/shattered-island.png')] pointer-events-none" />

        {/* 1. Double Happiness Symbol */}
        <div className="flex justify-center mb-6">
           <div className="w-16 h-16 md:w-20 md:h-20 bg-[#8E3535] mask-image-double-happiness flex items-center justify-center rounded-full opacity-90">
              {/* SVG Representation of 囍 */}
              <svg viewBox="0 0 100 100" className="w-12 h-12 md:w-14 md:h-14 fill-white" xmlns="http://www.w3.org/2000/svg">
                <path d="M22,24 h8 v-8 h8 v8 h8 v-8 h8 v8 h8 v24 h-8 v8 h8 v8 h-8 v8 h8 v8 h-18 v-8 h6 v-8 h-6 v-6 h-6 v6 h-6 v8 h6 v8 h-18 v-8 h8 v-8 h-8 v-8 h8 v-24 h-8 v-8 h-8 v-8 h8 z M28,30 v12 h6 v-12 z M48,30 v12 h6 v-12 z M28,58 v12 h6 v-12 z M48,58 v12 h6 v-12 z" />
              </svg>
           </div>
        </div>

        {/* 2. Date Header */}
        <div className="space-y-2 mb-10">
           <h2 className="font-serif text-xl md:text-2xl text-[#1a1a1a] tracking-wide">
             2026 年 05 月 30 日 星期六
           </h2>
           <p className="font-serif text-sm text-[#8E3535] opacity-80">
             農曆四月十四
           </p>
        </div>

        {/* 3. Calendar View */}
        <div className="mb-12">
            <div className="flex justify-between items-end mb-6 px-4 border-b border-stone-200 pb-4">
               <span className="font-serif text-5xl md:text-6xl text-[#8E3535] leading-none">05</span>
               <div className="flex flex-col text-right">
                  <span className="font-sans text-xs text-[#999] tracking-widest uppercase">May</span>
                  <span className="font-serif text-xl text-[#999]">2026</span>
               </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-y-4 gap-x-1 md:gap-x-2 text-center">
               {/* Days of Week */}
               {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                 <div key={d} className="text-xs text-[#b08d55] font-medium py-2">
                   {d}
                 </div>
               ))}
               
               {/* Calendar Days */}
               {calendarDays.map((day, idx) => {
                 const isWeddingDay = day === weddingDay;
                 return (
                   <div key={idx} className="flex justify-center items-center aspect-square">
                      {day ? (
                        <div className={`relative w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full transition-all ${isWeddingDay ? 'text-white shadow-md' : 'text-[#555]'}`}>
                           {isWeddingDay && (
                             <motion.div 
                               initial={{ scale: 0 }}
                               whileInView={{ scale: 1 }}
                               transition={{ type: "spring", stiffness: 300, damping: 15 }}
                               className="absolute inset-0 bg-[#8E3535] rounded-full" 
                             />
                           )}
                           {isWeddingDay && (
                             <div className="absolute -top-1 -right-1 text-xs">❤️</div>
                           )}
                           <span className="relative z-10 font-serif text-sm md:text-base">{day}</span>
                        </div>
                      ) : (
                        <span />
                      )}
                   </div>
                 );
               })}
            </div>
        </div>

        {/* 4. Countdown */}
        <div className="border-t border-stone-100 pt-8">
           <div className="flex gap-8 justify-center items-center">
              <TimerUnit value={timeLeft.days} label="Days" />
              <div className="h-8 w-[1px] bg-stone-200" />
              <TimerUnit value={timeLeft.hours} label="Hours" />
              <div className="h-8 w-[1px] bg-stone-200" />
              <TimerUnit value={timeLeft.minutes} label="Min" />
              <div className="h-8 w-[1px] bg-stone-200" />
              <TimerUnit value={timeLeft.seconds} label="Sec" />
           </div>
        </div>

      </div>
    </div>
  );
};
