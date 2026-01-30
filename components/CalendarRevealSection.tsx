
import React, { useState, useRef } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent, MotionValue } from 'framer-motion';
import { CALENDAR_COVER_IMAGE } from '../constants';

// --- Calendar Sub-components (Moved from Timeline) ---

// 1. The Final May 2026 Grid (Base Layer)
const CalendarBase = () => {
    // May 1st 2026 is a Friday (5 empty slots: Sun, Mon, Tue, Wed, Thu)
    const emptyDays = 5; 
    const totalDays = 31;
    const days = [];
    for(let i=0; i<emptyDays; i++) days.push(null);
    for(let i=1; i<=totalDays; i++) days.push(i);

    return (
       <div className="w-full h-full bg-[#fcfaf7] flex flex-col p-5 md:p-8 relative shadow-inner">
           {/* Realistic Paper Texture */}
           <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] pointer-events-none" />

           {/* Holes for the Rings */}
           <div className="absolute top-2 left-0 right-0 flex justify-evenly px-6 z-20">
              {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="w-3 h-3 rounded-full bg-[#eaddcf] shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)]" />
              ))}
           </div>

           {/* Header */}
           <div className="relative z-10 flex justify-between items-baseline mb-4 mt-6 text-[#8E3535]">
              <div className="flex items-baseline gap-2">
                 <span className="font-serif text-5xl leading-none font-medium text-[#8E3535]">05</span>
                 <span className="font-serif text-2xl font-medium text-[#8E3535] opacity-90">/ 30</span>
              </div>
              <span className="font-serif text-sm tracking-[0.2em] text-[#8E3535]">2026</span>
           </div>
           
           <div className="relative z-10 w-full h-px bg-stone-200 mb-4" />
           
           {/* Week Headers */}
           <div className="relative z-10 grid grid-cols-7 mb-3 text-center">
              {['日', '一', '二', '三', '四', '五', '六'].map(d => (
                  <span key={d} className="text-xs md:text-sm text-[#b08d55] font-serif font-medium">{d}</span>
              ))}
           </div>
           
           {/* Grid */}
           <div className="relative z-10 grid grid-cols-7 gap-y-3 gap-x-1 text-center font-serif text-stone-600">
              {days.map((d, i) => {
                 if (!d) return <div key={i} />;
                 const isWedding = d === 30;
                 return (
                    <div key={i} className="flex justify-center items-center">
                       {isWedding ? (
                           <div className="relative w-7 h-7 md:w-8 md:h-8 flex items-center justify-center">
                               <motion.div 
                                  animate={{ scale: [1, 1.1, 1] }}
                                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                  className="absolute inset-0 text-[#8E3535] drop-shadow-sm"
                               >
                                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                                     <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                  </svg>
                               </motion.div>
                               <span className="relative z-10 text-white text-[10px] font-bold leading-none pb-[1px]">{d}</span>
                           </div>
                       ) : (
                           <span className="text-sm font-medium text-stone-600">{d}</span>
                       )}
                    </div>
                 );
              })}
           </div>
           
           <div className="relative z-10 mt-auto pt-2 text-center">
               <span className="font-display text-[8px] md:text-[9px] tracking-[0.3em] text-[#b08d55] uppercase">The Wedding Day</span>
           </div>
       </div>
    );
};

// 2. The Cover Layer（月曆封面：jinghua-v-01）
const CalendarCover = ({ year }: { year: number }) => {
    return (
        <div className="w-full h-full relative overflow-hidden bg-stone-900 rounded-[2px] border-[0.5px] border-white/20">
            {/* Photo Background */}
            <div className="absolute inset-0">
                <img 
                    src={CALENDAR_COVER_IMAGE} 
                    alt="Our Story" 
                    className="w-full h-full object-cover object-center" 
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/70" />
            </div>

            {/* Holes for Rings (Must match base) */}
            <div className="absolute top-2 left-0 right-0 flex justify-evenly px-6 z-20">
                {[1,2,3,4,5,6].map(i => (
                    <div key={i} className="w-3 h-3 rounded-full bg-[#2c2c2c] shadow-[inset_0_1px_2px_rgba(0,0,0,0.8)]" />
                ))}
            </div>

            {/* Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-between py-12 z-10 text-center">
                
                <div className="flex flex-col items-center gap-2 pt-4">
                     <h3 className="font-display text-[9px] tracking-[0.4em] uppercase text-white/90 drop-shadow-md border-b border-white/30 pb-2">
                        Our Journey
                     </h3>
                </div>
                
                <div className="flex flex-col items-center justify-center">
                    <motion.div 
                        key={year}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="font-serif text-7xl md:text-8xl font-light tracking-tight text-white drop-shadow-xl tabular-nums leading-none"
                    >
                        {year}
                    </motion.div>
                </div>

                <div className="pb-4 opacity-90">
                     <p className="font-display text-[8px] tracking-[0.2em] text-white/70 uppercase mb-1">
                        Days Together
                    </p>
                    <p className="font-serif text-[11px] tracking-widest text-white border border-white/30 px-3 py-1 rounded-sm backdrop-blur-sm">
                        2017.12.02 - 2026.05.30
                    </p>
                </div>
            </div>
            
            {/* Paper Grain Texture */}
            <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/noise-lines.png')] mix-blend-overlay pointer-events-none" />
        </div>
    );
};

// 3. The Animated Flipping Calendar Component
const FlippingCalendar = ({ scrollYProgress, isMobile }: { scrollYProgress: MotionValue<number>; isMobile: boolean }) => {
    // --- ANIMATION TIMING ---
    // Phase 1: Count & Grow (0.0 -> 0.35)
    // Small scale up before the flip starts creates anticipation
    const scale = useTransform(scrollYProgress, [0, 0.35], [0.85, 1]); 
    const opacity = useTransform(scrollYProgress, [0, 0.1], [0.5, 1]);
    
    // Year Counter: 2017 -> 2025
    const yearFloat = useTransform(scrollYProgress, [0.0, 0.35], [2017, 2025]);
    const [yearDisplay, setYearDisplay] = useState(2017);
    useMotionValueEvent(yearFloat, "change", (latest) => setYearDisplay(Math.round(latest)));

    // Phase 2: The "Physics-Based" Flip (0.35 -> 0.7)
    // We go to 175 degrees so it rests almost flat but retains a tiny bit of "bounce" volume visually
    const rotateX = useTransform(scrollYProgress, [0.35, 0.7], isMobile ? [0, 0] : [0, 175]);
    
    // Scale Compression (Optical Illusion of Bending)
    // Slight variation in timing to feel organic
    const scaleY = useTransform(scrollYProgress, [0.35, 0.5, 0.7], [1, 0.9, 1]);

    // Lift Z (Simulate Arc)
    // Moves the page up towards the viewer mid-flip
    const z = useTransform(scrollYProgress, [0.35, 0.5, 0.7], isMobile ? [0, 0, 0] : [0, 60, 0]);

    // Sheen Effect
    const sheenOpacity = useTransform(scrollYProgress, [0.35, 0.45, 0.6], [0, 0.6, 0]);
    const sheenPosition = useTransform(scrollYProgress, [0.35, 0.65], ["100%", "-20%"]);

    // Shadows
    const spineShadowOpacity = useTransform(scrollYProgress, [0.35, 0.5, 0.65], [0, 0.4, 0]);
    const dropShadowOpacity = useTransform(scrollYProgress, [0.35, 0.5], [0.5, 0]);
    const dropShadowBlur = useTransform(scrollYProgress, [0.35, 0.5], [10, 60]);

    const coverOpacity = useTransform(scrollYProgress, [0.35, 0.55], isMobile ? [1, 0] : [1, 1]);

    return (
        <div className={`${isMobile ? '' : 'perspective-[2000px]'} w-full max-w-[340px] mx-auto aspect-[3/4.2]`}>
             <motion.div 
                style={{ 
                    scale, 
                    opacity, 
                    transformStyle: isMobile ? 'flat' : 'preserve-3d',
                    willChange: isMobile ? 'transform, opacity' : 'auto'
                }}
                className="relative w-full h-full"
             >
                 {/* --- STACK EFFECT (Pages underneath) --- */}
                 {/* Adds depth by showing pages waiting beneath */}
                 <div className="absolute inset-0 bg-[#f8f6f0] rounded-[6px] border border-stone-200"
                      style={{ transform: isMobile ? 'none' : "translateZ(-2px) translateY(3px) translateX(2px)" }} />
                 <div className="absolute inset-0 bg-[#f4f1ea] rounded-[6px] border border-stone-200"
                      style={{ transform: isMobile ? 'none' : "translateZ(-4px) translateY(6px) translateX(4px)" }} />
                 <div className="absolute inset-0 bg-[#ebe7e0] rounded-[6px] border border-stone-200"
                      style={{ transform: isMobile ? 'none' : "translateZ(-6px) translateY(9px) translateX(6px)" }} />

                 {/* --- BASE PAGE (Layer 0) --- */}
                 <motion.div 
                    className="absolute inset-0 bg-[#fdfbf7] rounded-[6px] origin-bottom" 
                    style={{ 
                        transform: "translateZ(0px)", 
                        boxShadow: useTransform(dropShadowBlur, b => `0px 25px ${b}px rgba(0,0,0,0.2)`),
                        willChange: isMobile ? 'opacity' : 'auto'
                    }}
                 >
                      <CalendarBase />
                      
                      {/* Darkening of the base page */}
                      <motion.div 
                        style={{ opacity: dropShadowOpacity }} 
                        className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none rounded-[6px]" 
                      />
                 </motion.div>

                 {/* --- FLIPPING COVER (Layer 1) --- */}
                 <motion.div 
                    style={{ 
                        rotateX, 
                        scaleY, 
                        z,
                        opacity: coverOpacity,
                        transformOrigin: "top center", 
                        transformStyle: isMobile ? 'flat' : "preserve-3d",
                        zIndex: 20,
                        willChange: isMobile ? 'transform, opacity' : 'auto'
                    }}
                    className={`absolute inset-0 rounded-[6px] ${isMobile ? '' : 'transform-gpu'}`}
                 >
                     {/* FRONT FACE (The Photo Cover) */}
                     <motion.div 
                        className="absolute inset-0 bg-stone-900 rounded-[6px] backface-hidden overflow-hidden" 
                        style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                     >
                         <CalendarCover year={yearDisplay} />
                         
                         {/* Specular Highlight */}
                         <motion.div 
                            style={{ 
                                opacity: sheenOpacity,
                                background: "linear-gradient(to top, transparent 0%, rgba(255,255,255,0.0) 20%, rgba(255,255,255,0.4) 40%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.4) 60%, rgba(255,255,255,0.0) 80%, transparent 100%)",
                                backgroundSize: "100% 200%",
                                backgroundPositionY: sheenPosition
                            }}
                            className="absolute inset-0 pointer-events-none z-30 mix-blend-overlay"
                         />
                         
                         {/* Ambient Occlusion */}
                         <motion.div 
                            style={{ opacity: spineShadowOpacity }}
                            className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" 
                         />
                     </motion.div>

                     {/* BACK FACE */}
                     <div 
                        className="absolute inset-0 bg-[#f4f1ea] flex items-center justify-center border border-stone-200 rounded-[6px]" 
                        style={{ 
                            backfaceVisibility: 'hidden', 
                            WebkitBackfaceVisibility: 'hidden', 
                            transform: "rotateX(180deg) translateZ(0.5px)"
                        }}
                     >
                          <div className="absolute inset-0 opacity-60 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]" />
                          <div className="flex flex-col items-center opacity-40 relative z-10" style={{ transform: "scaleY(-1)" }}>
                              <span className="font-display text-6xl text-[#b08d55] tracking-widest">J & J</span>
                              <div className="w-16 h-px bg-[#b08d55] my-4" />
                              <span className="font-serif text-sm text-[#b08d55] italic">Love Story</span>
                          </div>
                          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-transparent pointer-events-none" />
                     </div>
                 </motion.div>
                 
                 {/* --- BINDING RINGS --- */}
                 <div className="absolute -top-4 left-0 right-0 flex justify-evenly z-50 px-6 pointer-events-none">
                     {[1, 2, 3, 4, 5, 6].map(i => (
                         <div key={i} className="relative w-4 h-10 perspective-[100px]">
                             <div className="absolute top-0 w-full h-full rounded-full border-[4px] border-stone-400 border-b-transparent" style={{ transform: "rotateX(15deg) translateZ(-5px)"}} />
                             <div className="absolute top-0 w-full h-full rounded-full border-[4px] border-stone-200 border-b-transparent shadow-sm" style={{ transform: "rotateX(-5deg)"}} />
                         </div>
                     ))}
                 </div>
             </motion.div>
        </div>
    );
};

export const CalendarRevealSection: React.FC<{ isMobile: boolean }> = ({ isMobile }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    return (
        // Height ensures enough scroll distance for the flip animation
        <div ref={containerRef} className="relative h-[200vh] w-full bg-transparent">
            <div className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden">
                <div className="w-full px-6 relative z-10">
                    <FlippingCalendar scrollYProgress={scrollYProgress} isMobile={isMobile} />
                </div>
            </div>
        </div>
    );
};
