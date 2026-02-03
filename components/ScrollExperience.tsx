
import React, { useRef, useState, useMemo } from 'react';
import { useScroll, useTransform, motion, AnimatePresence, useMotionValueEvent } from 'framer-motion';
import { BookCover } from './BookCover';
import { FloatingPhoto } from './FloatingPhoto';
import { BACKGROUND_IMAGE, WEDDING_PHOTOS, APP_CONTENT } from '../constants';
import { Photo } from '../types';

interface ScrollExperienceProps {
  selectedPhoto: Photo | null;
  setSelectedPhoto: (photo: Photo | null) => void;
  isMobile: boolean;
  isHoveringFlyingPhoto?: boolean;
  onPhotoHoverChange?: (hovering: boolean) => void;
}

export const ScrollExperience: React.FC<ScrollExperienceProps> = ({ 
  selectedPhoto, 
  setSelectedPhoto,
  isMobile,
  isHoveringFlyingPhoto = false,
  onPhotoHoverChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const bgScale = useTransform(scrollYProgress, [0, 0.2, 1], [1, 1.08, 1.2]); 
  const bgY = useTransform(scrollYProgress, [0, 0.2, 1], ["0%", "-3%", "-12%"]);
  // Modified opacity to fade out fully at the end so the global pink/blue gradient is revealed
  // for the overlapped Invitation section
  const bgOpacity = useTransform(scrollYProgress, [0, 0.6, 0.85, 1], [1, 0.8, 0.8, 0]); 

  // --- Text Parallax Configuration ---
  // Speed up text fade out since scroll is shorter
  const textOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const textScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.9]);
  const textBlur = useTransform(scrollYProgress, [0, 0.15], ["blur(0px)", "blur(4px)"]);

  // Differential Y movement for depth perception
  const labelY = useTransform(scrollYProgress, [0, 0.3], ["0%", "-50%"]);
  const titleY = useTransform(scrollYProgress, [0, 0.3], ["0%", "-35%"]);
  const chineseY = useTransform(scrollYProgress, [0, 0.3], ["0%", "-20%"]);

  const bookContainerOpacity = useTransform(scrollYProgress, [0.1, 0.2, 0.9, 1], [0, 1, 1, 0]);
  const bookScale = useTransform(scrollYProgress, [0, 0.25, 0.7], isMobile ? [1.2, 1.2, 0.7] : [1.4, 1.4, 0.65]);
  const bookYOffset = useTransform(scrollYProgress, [0, 0.25, 0.7], isMobile ? ["0%", "0%", "5%"] : ["-5%", "-5%", "15%"]);
  const bookXOffset = useTransform(scrollYProgress, [0.25, 0.7], isMobile ? ["0vw", "8vw"] : ["0vw", "22vw"]);

  // 依照片數量動態產生 waves，照片越多飛出總時間越長（scroll 區間越大）
  const waves = useMemo(() => {
    const total = WEDDING_PHOTOS.length;
    const photosPerWave = Math.max(3, Math.min(5, Math.ceil(total / 8)));
    const numWaves = Math.ceil(total / photosPerWave);
    const flyOutStart = 0.35;
    const flyOutRange = Math.min(0.62, 0.12 * numWaves + 0.38);
    const flyOutEnd = Math.min(0.98, flyOutStart + flyOutRange);
    const triggers = numWaves <= 1
      ? [flyOutStart]
      : Array.from({ length: numWaves }, (_, i) => flyOutStart + (flyOutEnd - flyOutStart) * (i / (numWaves - 1)));
    return Array.from({ length: numWaves }, (_, i) => ({
      photos: WEDDING_PHOTOS.slice(i * photosPerWave, Math.min((i + 1) * photosPerWave, total)),
      trigger: triggers[i] ?? flyOutStart,
    })).filter(w => w.photos.length > 0);
  }, []);

  const photoWaves = useMemo(() => {
    return waves.map((wave, waveIdx) => (
      <React.Fragment key={`wave-${waveIdx}`}>
        {wave.photos.map((photo, index) => {
          // 僅電腦版：翻頁後的 wave 讓部分照片從相簿左側（書脊）起飛；手機維持右側
          const startFromSpine = !isMobile && waveIdx >= 1 && (waveIdx + index) % 2 === 0;
          return (
            <FloatingPhoto 
              key={`photo-${photo.id}-${waveIdx}-${index}`}
              photo={photo}
              index={index}
              totalInWave={wave.photos.length}
              progress={scrollYProgress}
              triggerStart={wave.trigger}
              onSelect={setSelectedPhoto}
              onHoverChange={onPhotoHoverChange}
              startFromSpine={startFromSpine}
              isMobile={isMobile}
            />
          );
        })}
      </React.Fragment>
    ));
  }, [waves, scrollYProgress, setSelectedPhoto, onPhotoHoverChange, isMobile]);

  const hintOpacity = useTransform(scrollYProgress, [0.35, 0.45, 0.7, 0.8], [0, 1, 1, 0]);
  const hintOffset = useTransform(scrollYProgress, [0.35, 0.45], [20, 0]);

  // 電腦版捲動慢約 0.5 倍；照片越多飛出區段越高，總飛出時間越長
  const photoCount = WEDDING_PHOTOS.length;
  const baseVh = isMobile ? 280 : 420;
  const extraVhPerPhoto = Math.max(0, (photoCount - 24) * 10);
  const scrollHeight = `${baseVh + extraVhPerPhoto}vh`;

  return (
    <div ref={containerRef} className="relative w-full bg-transparent" style={{ height: scrollHeight }}>
      
      <div className={`sticky top-0 h-[100vh] w-full overflow-hidden flex flex-col items-center justify-center ${isMobile ? '' : 'transform-gpu'}`}>
        
        {/* Hint Text for Gallery - 不參與變暗，保持清晰 */}
        <motion.div
          style={{ 
            opacity: hintOpacity, 
            x: isMobile ? "-50%" : -hintOffset,
            y: isMobile ? hintOffset : "-50%",
          }}
          className={`absolute z-[70] pointer-events-none ${isMobile ? 'left-1/2 bottom-[8%]' : 'left-8 md:left-12 top-1/2'}`}
        >
          <motion.div 
            animate={{ 
              y: isMobile ? [0, -3, 0] : [0, -5, 0],
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="bg-white/50 backdrop-blur-xl px-4 py-2.5 md:px-3 md:py-8 rounded-full border border-[#8a6a3d]/30 shadow-[0_8px_32px_rgba(138,106,61,0.15)] flex flex-row md:flex-col items-center gap-2 md:gap-4"
          >
            <motion.span 
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-[#8a6a3d] text-[10px] md:text-sm font-serif leading-none"
            >
              ✦
            </motion.span>
            
            <span className="text-[#8a6a3d] text-[11px] md:text-[15px] tracking-[0.2em] md:tracking-[0.4em] font-serif md:[writing-mode:vertical-rl] whitespace-nowrap font-medium opacity-90">
              點擊照片開啟婚紗藝廊
            </span>
            
            <motion.span 
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              className="text-[#8a6a3d] text-[10px] md:text-sm font-serif leading-none"
            >
              ✦
            </motion.span>
          </motion.div>
        </motion.div>

        {/* 電腦版：滑鼠在飛出相片上時，此區變暗以凸顯照片；左側提示不在此區內故不變暗 */}
        <motion.div
          className="absolute inset-0 z-[5] pointer-events-none"
          initial={false}
          animate={{ opacity: !isMobile && isHoveringFlyingPhoto ? 0.5 : 1 }}
          transition={{ duration: 0.35 }}
        >
          {/* Ambient Background Effects */}
          <div className={`absolute inset-0 z-0 pointer-events-none ${isMobile ? '' : 'transform-gpu'}`}>
             <div className="absolute top-[-20%] left-[-20%] w-[80vw] h-[80vw] bg-rose-100/30 blur-[60px] md:blur-[120px] rounded-full mix-blend-multiply animate-pulse" />
             <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-sky-100/30 blur-[50px] md:blur-[100px] rounded-full mix-blend-multiply" />
          </div>

          <motion.div 
              style={{ 
                scale: bgScale, 
                y: bgY, 
                opacity: bgOpacity,
                willChange: isMobile ? 'transform, opacity' : 'auto'
              }}
              className={`absolute inset-0 z-0 overflow-hidden ${isMobile ? '' : 'transform-gpu'}`}
          >
              <img 
                src={BACKGROUND_IMAGE} 
                alt="Background" 
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/40 to-transparent z-10 pointer-events-none h-[45%]" />
              <div className="absolute bottom-0 left-0 w-full h-[20%] bg-gradient-to-t from-white to-transparent z-10" />
          </motion.div>
        </motion.div>

        {/* Hero Text Content - 在變暗 wrapper 外，滑鼠懸停飛出照片時保持完全可見 */}
        <motion.div 
          style={{ 
            opacity: textOpacity, 
            scale: textScale, 
            filter: textBlur,
            willChange: isMobile ? 'transform, opacity' : 'auto'
          }}
          className={`absolute top-[12%] md:top-[15%] left-0 right-0 z-30 flex flex-col items-center justify-center text-center px-6 pointer-events-none w-full max-w-4xl mx-auto ${isMobile ? '' : 'transform-gpu'}`}
        >
          {/* Top Label */}
          <motion.div style={{ y: labelY }} className="flex items-center gap-4 mb-4 md:mb-6 opacity-80">
             <div className="h-[0.5px] w-8 md:w-12 bg-[#2c3e50]" />
             <p className="font-display tracking-[0.3em] text-[9px] md:text-[10px] text-[#2c3e50] uppercase font-semibold">The Wedding</p>
             <div className="h-[0.5px] w-8 md:w-12 bg-[#2c3e50]" />
          </motion.div>

          {/* Main Title */}
          <motion.h1 
            style={{ y: titleY }}
            className="relative font-script text-[4rem] md:text-[6rem] lg:text-[7.5rem] text-[#8a6a3d] leading-none drop-shadow-md z-10 mix-blend-multiply"
          >
            {APP_CONTENT.coupleName}
          </motion.h1>
          
          {/* Chinese Names */}
          <motion.div 
            style={{ y: chineseY }}
            className="relative mt-4 md:mt-6 z-10"
          >
             <p className="font-serif text-2xl md:text-4xl text-[#1a202c] tracking-[0.2em] font-bold flex items-center justify-center gap-4 drop-shadow-[0_1px_4px_rgba(255,255,255,0.9)]">
                <span>李謦伊</span>
                <span className="text-red-600 text-xl md:text-3xl animate-pulse">❤</span>
                <span>張家銘</span>
             </p>
          </motion.div>
        </motion.div>

        <motion.div 
            style={{ 
              opacity: bookContainerOpacity, 
              scale: bookScale, 
              y: bookYOffset,
              x: bookXOffset,
              perspective: isMobile ? 'none' : '2500px',
              willChange: isMobile ? 'transform, opacity' : 'auto'
            }}
            className={`absolute top-[45%] md:top-[50%] w-full flex items-center justify-center z-20 ${isMobile ? '' : 'transform-gpu'}`}
        >
          {/* Photos Stream - 不變暗，維持清晰 */}
          <motion.div 
            style={{ x: "-12vw", transformStyle: isMobile ? 'flat' : 'preserve-3d' }}
            className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none z-20" 
          >
             {photoWaves}
          </motion.div>

          {/* 電腦版：滑鼠在飛出相片上時，相簿本體變暗 */}
          <motion.div
            className="relative z-10 transition-opacity duration-300"
            style={{ transformStyle: isMobile ? 'flat' : 'preserve-3d' }}
            initial={false}
            animate={{ opacity: !isMobile && isHoveringFlyingPhoto ? 0.5 : 1 }}
            transition={{ duration: 0.35 }}
          >
            <BookCover 
              progress={scrollYProgress} 
              onSelectPhoto={setSelectedPhoto}
              isMobile={isMobile}
            />
          </motion.div>
        </motion.div>
        
      </div>
    </div>
  );
};
