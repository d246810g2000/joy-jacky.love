
import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

// ==========================================
// 🔧 調整區域 (Configuration)
// ==========================================
// Adjusted clamps for narrower desktop width (Max width 460px -> Half width 230px)
const ENVELOPE_CONFIG = {
  FLAP_HEIGHT: "clamp(0px, 29vw, 155px)", 
  FLAP_WIDTH_HALF: "clamp(0px, 45vw, 230px)",
  SEAL_POSITION: {
    MOBILE: { X: "-25px", Y: "-140px" },
    DESKTOP: { X: "-30px", Y: "-185px" } // Adjusted Y for shorter flap
  }
};

// Reusable graphic for the split effect
const SealGraphic = () => (
  <div className="relative w-16 h-16 md:w-20 md:h-20 select-none drop-shadow-md group">
      {/* Outer irregular shape */}
      <div className="absolute inset-0 bg-[#8E3535] rounded-[40%_60%_70%_30%/40%_50%_60%_50%] shadow-inner rotate-12 scale-110" />
      
      {/* Inner Circle */}
      <div className="absolute inset-0 bg-[#7a2e2e] rounded-full scale-95 border-[3px] border-[#9e4242]/80 shadow-[inset_0_2px_6px_rgba(0,0,0,0.5)] flex items-center justify-center overflow-hidden">
          <div className="w-[72%] h-[72%] border border-[#b55050]/50 rounded-full flex items-center justify-center shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)] bg-[#7a2e2e] relative z-10">
              <span className="font-serif text-2xl md:text-3xl text-[#d4af37] drop-shadow-sm opacity-90 select-none mt-[-2px] font-bold">囍</span>
          </div>
          
          {/* Shimmer Effect */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent z-20 pointer-events-none"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut", repeatDelay: 1 }}
          />
      </div>
      
      {/* Highlight/Reflection */}
      <div className="absolute top-3 left-4 w-5 h-2.5 bg-white/10 rounded-full rotate-[-45deg] blur-[1px] z-20" />
  </div>
);

// Magical Seal Break Animation (Particles + Glow)
const SealParticles = ({ progress }: { progress: any }) => {
  // Explosion opacity sequence: appear quickly, hold, fade out
  const opacity = useTransform(progress, [0.32, 0.34, 0.45], [0, 1, 0]);
  
  // Expansion: Start small, explode outward
  const scale = useTransform(progress, [0.32, 0.4], [0.5, 2.0]);
  
  // Rotation for dynamic feel
  const rotate = useTransform(progress, [0.32, 0.45], [0, 20]);
  
  // Flash/Glow Effect: Bursts then fades as card reveals (card reveal is 0.5+)
  const glowOpacity = useTransform(progress, [0.33, 0.36, 0.6], [0, 0.8, 0]);
  const glowScale = useTransform(progress, [0.33, 0.6], [1, 2.5]);

  return (
    <>
      {/* 1. The Glow/Flash */}
      <motion.div
        style={{ opacity: glowOpacity, scale: glowScale }}
        className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none"
      >
         <div className="w-24 h-24 bg-gradient-to-r from-[#d4af37] to-[#fcd34d] blur-[30px] rounded-full mix-blend-screen opacity-70" />
         <div className="absolute w-28 h-28 bg-white blur-[50px] rounded-full mix-blend-overlay opacity-50" />
      </motion.div>

      {/* 2. Particles Container */}
      <motion.div 
         style={{ opacity, scale, rotate }} 
         className="absolute inset-0 pointer-events-none flex items-center justify-center z-0"
      >
         {/* Ring of Shards (Wax Crumbs) */}
         {[...Array(8)].map((_, i) => {
            const angle = i * 45; // 8 shards
            const delay = i % 2 === 0 ? 0 : 5; // Slight offset variation
            return (
              <div key={`shard-${i}`} className="absolute inset-0 flex items-center justify-center">
                 <div 
                   className="w-1.5 h-1.5 md:w-2 md:h-2 bg-[#8E3535] shadow-sm"
                   style={{ 
                     transform: `rotate(${angle}deg) translateY(-${22 + delay}px) rotate(${angle * 2}deg)`,
                     clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' // Diamond shard shape
                   }} 
                 />
              </div>
            );
         })}

         {/* Ring of Gold Dust */}
         {[...Array(12)].map((_, i) => {
            const angle = i * 30;
            const dist = 30 + (i % 3) * 5;
            return (
              <div key={`dust-${i}`} className="absolute inset-0 flex items-center justify-center">
                 <div 
                   className="w-0.5 h-0.5 md:w-1 md:h-1 bg-[#d4af37] rounded-full shadow-[0_0_2px_#d4af37]"
                   style={{ 
                     transform: `rotate(${angle}deg) translateY(-${dist}px)`,
                     opacity: Math.random() * 0.5 + 0.5
                   }} 
                 />
              </div>
            );
         })}
      </motion.div>
    </>
  );
};

// 🤚 Finger Graphics (Rendered BEHIND envelope)
const FingersGraphic = ({ side }: { side: 'left' | 'right' }) => {
  const isLeft = side === 'left';
  return (
    <svg 
      viewBox="0 0 200 200" 
      className={`w-full h-full ${isLeft ? '' : '-scale-x-100'}`}
    >
      <path 
        d="M60,200 C60,150 70,80 120,70 C160,60 190,90 195,120 C200,160 180,200 180,200 Z" 
        fill="#e6cfb8" 
      />
    </svg>
  );
};

// 👍 Thumb Graphics (Rendered IN FRONT of envelope)
const ThumbGraphic = ({ side }: { side: 'left' | 'right' }) => {
  const isLeft = side === 'left';
  return (
    <svg 
      viewBox="0 0 200 200" 
      className={`w-full h-full ${isLeft ? '' : '-scale-x-100'}`}
      style={{ filter: 'drop-shadow(1px 2px 4px rgba(0,0,0,0.1))' }} 
    >
      <path 
        d="M20,200 C20,140 30,100 80,90 C130,80 160,110 160,140 C160,170 140,200 120,200 Z" 
        fill="#f3e5d8" 
      />
      <ellipse cx="110" cy="130" rx="15" ry="8" fill="rgba(255,255,255,0.3)" transform="rotate(-20, 110, 130)" />
    </svg>
  );
};

interface EnvelopeInvitationProps {
  isMobile: boolean;
}

export const EnvelopeInvitation: React.FC<EnvelopeInvitationProps> = ({ isMobile }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // --- Animation Phasing ---
  
  // 1. Container/Envelope Movement
  // Start slightly higher since we are overlapping sections now
  const envelopeRotateX = useTransform(scrollYProgress, [0, 0.35], isMobile ? [0, 0] : [35, 0]); 
  const envelopeScale = useTransform(scrollYProgress, [0, 0.35, 0.9], [0.65, 1, 1.05]); // Starts slightly larger
  const envelopeY = useTransform(scrollYProgress, [0, 0.35, 1], ["50%", "18%", "80%"]);

  // Envelope Ghost Opacity
  const envelopeGhostOpacity = useTransform(scrollYProgress, [0.7, 0.95], [1, 0]);
  const handOpacity = useTransform(scrollYProgress, [0.7, 0.95], [1, 0]);

  // 2. Flap Mechanics
  const flapRotate = useTransform(scrollYProgress, [0.35, 0.55], isMobile ? [0, 0] : [0, 180]);
  const flapZIndex = useTransform(scrollYProgress, [0.35, 0.36], [50, 1]); 
  const flapZ = useTransform(scrollYProgress, [0.35, 0.45], [6, 0]);
  
  // Dynamic Flap Lighting (Simulating light hitting paper as it opens)
  const flapColor = useTransform(
    scrollYProgress,
    [0.35, 0.45, 0.55],
    ["#E6E2D6", "#F2EFE9", "#D1CEC5"] // Base -> Highlight -> Shadowed
  );

  // 3. Wax Seal Animation
  const splitDist = useTransform(scrollYProgress, [0.3, 0.35], [0, 14]);
  const splitRotateTop = useTransform(scrollYProgress, [0.3, 0.35], [0, -12]);
  const splitRotateBottom = useTransform(scrollYProgress, [0.3, 0.35], [0, 12]);
  const sealScale = useTransform(scrollYProgress, [0.3, 0.35], [1, 1.1]); 
  const sealOpacity = useTransform(scrollYProgress, [0.32, 0.38], [1, 0]); 

  // 4. Card Extraction
  const cardY = useTransform(scrollYProgress, [0.5, 1], ["2%", "-75%"]); 
  const cardScale = useTransform(scrollYProgress, [0.5, 1], [0.96, 1.05]); 
  const cardZ = useTransform(scrollYProgress, [0.5, 1], [0, 0]); 

  return (
    <div ref={containerRef} className="relative h-[150vh] w-full bg-transparent">
      
      {/* Sticky Viewport */}
      <div
        className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden perspective-[1200px]"
        style={{ perspective: isMobile ? 'none' : '1200px' }}
      >
        
        {/* --- 3D SCENE ROOT --- */}
        <motion.div
          style={{ 
            scale: envelopeScale,
            rotateX: envelopeRotateX,
            y: envelopeY,
            transformStyle: isMobile ? 'flat' : "preserve-3d",
            willChange: isMobile ? 'transform' : 'auto'
          }}
          // Updated: Reduced md:max-w to 460px for a more elegant desktop view
          className="relative w-[90vw] max-w-[580px] md:max-w-[460px] aspect-[1.55/1] z-10"
        >
            {/* 
               🤚 LAYER 1: FINGERS (BEHIND ENVELOPE)
            */}
            
            {/* Left Fingers (Back) */}
            <motion.div
               style={{ opacity: handOpacity, rotate: -15 }}
               className="absolute -bottom-[8%] -left-[5%] w-[30%] h-[30%] pointer-events-none origin-center"
            >
               <div style={{ transform: isMobile ? 'none' : "translateZ(-10px)" }} className="w-full h-full">
                  <FingersGraphic side="left" />
               </div>
            </motion.div>

            {/* Right Fingers (Back) */}
            <motion.div
               style={{ opacity: handOpacity, rotate: 15 }}
               className="absolute -bottom-[8%] -right-[5%] w-[30%] h-[30%] pointer-events-none origin-center"
            >
               <div style={{ transform: isMobile ? 'none' : "translateZ(-10px)" }} className="w-full h-full">
                  <FingersGraphic side="right" />
               </div>
            </motion.div>


            {/* 1. Envelope Back (Base) */}
            <motion.div 
              className="absolute inset-0 bg-[#E6E2D6] rounded-[4px] shadow-2xl border border-[#d6d2c4]" 
              style={{ transform: isMobile ? 'none' : "translateZ(-1px)", opacity: isMobile ? 1 : envelopeGhostOpacity }}
            >
                <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]" />
            </motion.div>

            {/* 2. The Invitation Card (Slides Out) */}
            <motion.div
              style={{ 
                y: cardY,
                scale: cardScale,
                z: cardZ,
                transformStyle: isMobile ? 'flat' : "preserve-3d",
                willChange: isMobile ? 'transform' : 'auto',
                opacity: isMobile ? useTransform(scrollYProgress, [0.4, 0.6], [0, 1]) : 1
              }}
              // Enhanced Shadow for Glow
              className="absolute inset-x-[12px] inset-y-[8px] shadow-[0_4px_30px_rgba(212,175,55,0.4)] rounded-[3px] z-10 flex flex-col items-center justify-center origin-bottom overflow-hidden bg-[#d4af37]"
            >
                {/* --- FLOWING BORDER EFFECT (Liquid Gold) --- */}
                <div className="absolute inset-0 z-0 overflow-hidden rounded-[3px]">
                   {/* Layer 1: Base Metallic Texture (Rich, Darker Gold - Slow Rotation) */}
                   <motion.div
                      className="absolute inset-[-100%] will-change-transform"
                      style={{
                        background: "conic-gradient(from 0deg, #d4af37, #f3e5d8, #d4af37, #8a6a3d, #d4af37)"
                      }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                   />
                   
                   {/* Layer 2: The "Flowing Light" Beam (Bright White-Gold - Fast Rotation) */}
                   <motion.div
                      className="absolute top-1/2 left-1/2 w-[200%] h-[200%] -translate-x-1/2 -translate-y-1/2 will-change-transform"
                      style={{
                        background: "conic-gradient(from 0deg, transparent 0deg, transparent 80deg, #b08d55 100deg, #fff 110deg, #b08d55 120deg, transparent 140deg)",
                        filter: "blur(6px)"
                      }}
                      animate={{ rotate: 360 }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                   />
                </div>

                {/* --- INNER PAPER CONTENT --- */}
                {/* Inset by 2px (increased from 1.5) to reveal the flowing border clearly */}
                <div className="absolute inset-[2px] bg-[#FCFAF6] rounded-[2px] z-10 flex flex-col justify-between overflow-hidden shadow-[inset_0_0_20px_rgba(139,119,101,0.1)]">
                    {/* Surface Sheen (Passing Light - Smoother & Slower) */}
                    <motion.div 
                      className="absolute top-0 bottom-0 -left-[100%] w-[150%] bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg] z-20 pointer-events-none"
                      animate={{ left: ["-100%", "250%"] }}
                      transition={{ duration: 4, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
                    />

                    {/* --- TEXTURE LAYERS --- */}
                    
                    {/* 0. Rich Warm Gradient Base */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#fffbf0] via-[#fcf9f2] to-[#f2ece4] z-0" />

                    {/* 1. Heavy Watercolor Texture for tactile feel */}
                    <div className="absolute inset-0 opacity-[0.5] bg-[url('https://www.transparenttextures.com/patterns/watercolor.png')] pointer-events-none mix-blend-multiply z-0" />

                    {/* 2. Paper Fibers for organic detail */}
                    <div className="absolute inset-0 opacity-[0.25] bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')] pointer-events-none mix-blend-multiply z-0" />

                    {/* 3. Subtle Noise for matte finish */}
                    <div className="absolute inset-0 opacity-[0.4] bg-[url('https://www.transparenttextures.com/patterns/noise-lines.png')] mix-blend-soft-light pointer-events-none z-0" />
                    
                    {/* Decorative Inner Borders (Foil Stamped Look) */}
                    <div className="absolute inset-[6px] border border-[#C5A065]/30 pointer-events-none z-10 rounded-[1px]" />
                    <div className="absolute inset-[9px] border-[0.5px] border-[#C5A065]/20 pointer-events-none z-10 rounded-[1px]" />

                    {/* Corner Ornaments (Simple CSS corners) */}
                    <div className="absolute top-[6px] left-[6px] w-4 h-4 border-t border-l border-[#C5A065]/60 z-10" />
                    <div className="absolute top-[6px] right-[6px] w-4 h-4 border-t border-r border-[#C5A065]/60 z-10" />
                    <div className="absolute bottom-[6px] left-[6px] w-4 h-4 border-b border-l border-[#C5A065]/60 z-10" />
                    <div className="absolute bottom-[6px] right-[6px] w-4 h-4 border-b border-r border-[#C5A065]/60 z-10" />

                    <div className="relative z-10 w-full h-full flex flex-col justify-between py-6 px-5 md:py-10 md:px-10">
                        
                        {/* Poem Section - High-End Serif Style */}
                        <div className="flex-1 flex flex-col items-center justify-center pt-2 md:pt-4">
                             <div className="flex flex-col gap-3 md:gap-5 text-center">
                                {/* Intro: Delicate Serif */}
                                <p className="font-serif text-[#5A4A42] text-xs md:text-sm tracking-[0.25em] leading-loose uppercase opacity-80">
                                    在時間的畫布上 · 我們即將用愛
                                </p>
                                
                                {/* Hero: Bold Elegant Serif for "The Stroke" - SIZE REDUCED HERE */}
                                <div className="relative mt-2 md:mt-3">
                                    <p className="font-serif font-bold text-[#8E3535] text-2xl md:text-4xl tracking-[0.15em] drop-shadow-[0_2px_2px_rgba(255,255,255,0.8)] leading-tight">
                                        畫上最燦爛的一筆
                                    </p>
                                </div>
                             </div>
                        </div>

                        {/* Invitation Text Section - High-End Formal Layout */}
                        <div className="flex-none w-full relative mb-5 md:mb-8">
                            
                            {/* Elegant Divider */}
                            <div className="w-full flex items-center justify-center mb-5 md:mb-6 opacity-40">
                                <div className="h-px bg-gradient-to-r from-transparent via-[#8a6a3d] to-transparent w-2/3" />
                            </div>

                            {/* Invitation Content */}
                            <div className="flex flex-col items-center justify-center text-center space-y-4">
                                {/* Title: Formal, Wide Tracking, Serif */}
                                <div className="relative">
                                    <h3 className="font-serif text-[#2c3e50] text-xl md:text-2xl tracking-[0.5em] font-normal leading-relaxed drop-shadow-[0_1px_0_rgba(255,255,255,0.8)] pl-[0.5em]">
                                        誠摯邀請您
                                    </h3>
                                </div>

                                {/* Subtitle: Soft, Serif Light, with decorative lines */}
                                <div className="flex items-center gap-3 md:gap-4">
                                    <span className="h-px w-3 md:w-6 bg-[#b08d55]/40"></span>
                                    <p className="font-serif text-[#8a6a3d] text-sm md:text-lg tracking-[0.2em] font-light drop-shadow-sm">
                                        與我們分享這份喜悅
                                    </p>
                                    <span className="h-px w-3 md:w-6 bg-[#b08d55]/40"></span>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </motion.div>


            {/* 3. Envelope Pocket (Front-Bottom & Sides) */}
            <motion.div 
                className="absolute inset-0 z-20 pointer-events-none" 
                style={{ transform: isMobile ? 'none' : "translateZ(2px)", opacity: envelopeGhostOpacity }}
            >
                 <div 
                    style={{ borderLeftWidth: ENVELOPE_CONFIG.FLAP_WIDTH_HALF }}
                    className="absolute inset-y-0 left-0 w-0 border-t-[18vw] md:border-t-[110px] border-b-[18vw] md:border-b-[110px] border-l-[#DFDCD3] border-t-transparent border-b-transparent brightness-[0.97]" 
                 />
                 <div 
                    style={{ borderRightWidth: ENVELOPE_CONFIG.FLAP_WIDTH_HALF }}
                    className="absolute inset-y-0 right-0 w-0 border-t-[18vw] md:border-t-[110px] border-b-[18vw] md:border-b-[110px] border-r-[#DFDCD3] border-t-transparent border-b-transparent brightness-[0.97]" 
                 />
                 <div 
                    style={{ 
                        borderLeftWidth: ENVELOPE_CONFIG.FLAP_WIDTH_HALF, 
                        borderRightWidth: ENVELOPE_CONFIG.FLAP_WIDTH_HALF 
                    }}
                    className="absolute bottom-0 left-0 right-0 h-0 border-b-[32vw] md:border-b-[200px] border-l-transparent border-r-transparent border-b-[#EBE7DE] shadow-sm" 
                 />
            </motion.div>

            {/* 4. Top Flap (Static on Mobile, Animated on Desktop) */}
            <motion.div 
               style={{ 
                 rotateX: flapRotate, 
                 zIndex: flapZIndex,
                 transformOrigin: "top",
                 transformStyle: isMobile ? 'flat' : "preserve-3d",
                 borderTopWidth: ENVELOPE_CONFIG.FLAP_HEIGHT,
                 borderLeftWidth: ENVELOPE_CONFIG.FLAP_WIDTH_HALF,
                 borderRightWidth: ENVELOPE_CONFIG.FLAP_WIDTH_HALF,
                 borderTopColor: flapColor, // Animated Lighting
                 z: isMobile ? 0 : flapZ,
                 opacity: envelopeGhostOpacity
               }}
               className="absolute top-0 left-0 right-0 h-0 border-l-transparent border-r-transparent drop-shadow-lg origin-top"
            >
               {/* 5. Wax Seal */}
               <motion.div 
                 style={{ 
                   scale: sealScale, 
                   opacity: sealOpacity,
                   top: ENVELOPE_CONFIG.FLAP_HEIGHT,
                   "--seal-mobile-x": ENVELOPE_CONFIG.SEAL_POSITION.MOBILE.X,
                   "--seal-mobile-y": ENVELOPE_CONFIG.SEAL_POSITION.MOBILE.Y,
                   "--seal-desktop-x": ENVELOPE_CONFIG.SEAL_POSITION.DESKTOP.X,
                   "--seal-desktop-y": ENVELOPE_CONFIG.SEAL_POSITION.DESKTOP.Y,
                 } as any}
                 className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 flex items-center justify-center
                            ml-[var(--seal-mobile-x)] mt-[var(--seal-mobile-y)] 
                            md:ml-[var(--seal-desktop-x)] md:mt-[var(--seal-desktop-y)]"
               >
                  <div className="relative w-16 h-16 md:w-20 md:h-20 group cursor-pointer">
                      <div className="absolute inset-0 bg-red-900/10 blur-xl rounded-full" />
                      
                      {/* Magic Particles behind the seal */}
                      <SealParticles progress={scrollYProgress} />

                      {/* Top Half */}
                      <motion.div 
                        style={{ y: useTransform(splitDist, v => -v), rotate: splitRotateTop }} 
                        className="absolute inset-0 z-20 origin-bottom"
                        initial={{ clipPath: 'polygon(0 0, 100% 0, 100% 50%, 75% 58%, 50% 42%, 25% 58%, 0 50%)' }}
                      >
                         <SealGraphic />
                      </motion.div>
                      {/* Bottom Half */}
                      <motion.div 
                        style={{ y: splitDist, rotate: splitRotateBottom }} 
                        className="absolute inset-0 z-10 origin-top"
                        initial={{ clipPath: 'polygon(0 50%, 25% 58%, 50% 42%, 75% 58%, 100% 50%, 100% 100%, 0 100%)' }}
                      >
                         <SealGraphic />
                      </motion.div>
                  </div>
               </motion.div>
            </motion.div>

            {/* 
               👍 LAYER 3: THUMBS (FRONT OF ENVELOPE - 在信封底部)
            */}
            
            {/* Left Thumb */}
            <motion.div
               style={{ 
                 opacity: handOpacity, 
                 rotate: -20,
                 z: isMobile ? 0 : 60,
                 transformStyle: isMobile ? 'flat' : "preserve-3d"
               }}
               className="absolute -bottom-[10%] -left-[10%] w-[35%] h-[35%] pointer-events-none origin-center z-50"
            >
               <div className="w-full h-full">
                  <ThumbGraphic side="left" />
               </div>
            </motion.div>

            {/* Right Thumb */}
            <motion.div
               style={{ 
                 opacity: handOpacity, 
                 rotate: 20,
                 z: isMobile ? 0 : 60, 
                 transformStyle: isMobile ? 'flat' : "preserve-3d"
               }}
               className="absolute -bottom-[10%] -right-[10%] w-[35%] h-[35%] pointer-events-none origin-center z-50"
            >
               <div className="w-full h-full">
                   <ThumbGraphic side="right" />
               </div>
            </motion.div>

        </motion.div>
      </div>
    </div>
  );
};
