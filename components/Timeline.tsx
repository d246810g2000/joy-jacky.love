
import React from 'react';
import { TIMELINE_EVENTS } from '../constants';
import { motion } from 'framer-motion';

// --- Icons ---
const CocktailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 3.75L5.25 17.25" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 3.75l13.5 13.5" />
    <path d="M8 21h8" strokeLinecap="round" />
    <path d="M12 17v4" strokeLinecap="round" />
    <path d="M12 12L5 5" strokeLinecap="round" />
    <path d="M12 12l7-7" strokeLinecap="round" />
  </svg>
);

const RingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
    <circle cx="9" cy="12" r="5" />
    <circle cx="15" cy="12" r="5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 7l-1-2h2l-1 2" />
  </svg>
);

const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
  </svg>
);

const getIcon = (index: number) => {
  if (index === 0) return <CocktailIcon />;
  if (index === 1) return <RingIcon />;
  return <CameraIcon />;
};

export const Timeline: React.FC = () => {
  return (
    <div className="relative w-full py-20 px-4 md:px-0 bg-transparent">
      
      {/* Timeline Events */}
      <div className="w-full">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto space-y-12"
          >
             {TIMELINE_EVENTS.map((event, index) => {
                const isEven = index % 2 === 0;
                return (
                  <div 
                    key={index}
                    className={`relative flex items-start md:items-center gap-6 md:gap-0 ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                  >
                    {/* Time Display */}
                    <div className={`hidden md:block w-1/2 ${isEven ? 'text-right pr-12' : 'text-left pl-12'}`}>
                       <span className="font-display text-4xl text-[#b08d55]/80 font-light">{event.time}</span>
                    </div>

                    {/* Icon Marker */}
                    <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 flex items-center justify-center z-10">
                       <div className="w-14 h-14 rounded-full bg-[#fdfbf7] border border-[#b08d55]/30 flex items-center justify-center text-[#b08d55] shadow-sm">
                          {getIcon(index)}
                       </div>
                    </div>

                    {/* Content Card */}
                    <div className="w-full md:w-1/2 pl-20 md:pl-0">
                       <div className={`relative group ${isEven ? 'md:ml-12' : 'md:mr-12 md:text-right'}`}>
                          <span className="md:hidden font-display text-2xl text-[#b08d55] font-light block mb-2">{event.time}</span>
                          
                          <div className="glass-panel p-6 rounded-lg border border-white/60 bg-white/40 hover:bg-white/70 transition-all duration-500 shadow-sm group-hover:shadow-md">
                            <div className={`flex flex-col ${!isEven ? 'md:items-end' : ''}`}>
                              <span className="font-display text-[10px] text-[#b08d55] tracking-[0.2em] uppercase mb-1">
                                {event.title}
                              </span>
                              <h3 className="font-serif text-xl md:text-2xl text-[#2c3e50] mb-3 group-hover:text-[#b08d55] transition-colors">
                                {event.chineseTitle}
                              </h3>
                              <p className="text-sm text-[#7f8c8d] font-light leading-relaxed">
                                {event.description}
                              </p>
                            </div>
                          </div>
                       </div>
                    </div>
                  </div>
                );
             })}
          </motion.div>
      </div>
    </div>
  );
};
