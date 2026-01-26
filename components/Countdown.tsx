import React, { useState, useEffect } from 'react';
import { APP_CONTENT } from '../constants';

export const Countdown: React.FC = () => {
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

  const TimerUnit = ({ value, label }: { value: number, label: string }) => (
    <div className="flex flex-col items-center bg-white/60 border border-white rounded-md p-3 w-20 md:w-24 backdrop-blur-md shadow-sm">
      <span className="font-display text-2xl md:text-3xl text-[#2c3e50] font-semibold">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[9px] md:text-[10px] text-[#b08d55] uppercase tracking-widest mt-1">
        {label}
      </span>
    </div>
  );

  return (
    <div className="py-8 flex gap-3 md:gap-4 justify-center items-center flex-wrap">
      <TimerUnit value={timeLeft.days} label="Days" />
      <TimerUnit value={timeLeft.hours} label="Hrs" />
      <TimerUnit value={timeLeft.minutes} label="Min" />
      <TimerUnit value={timeLeft.seconds} label="Sec" />
    </div>
  );
};