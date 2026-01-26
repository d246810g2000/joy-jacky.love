
import React, { useRef, useState, useMemo } from 'react';
import { useScroll, useTransform, motion, AnimatePresence, useMotionValueEvent } from 'framer-motion';
import { BookCover } from './BookCover';
import { FloatingPhoto } from './FloatingPhoto';
import { Lightbox } from './Lightbox';
import { BACKGROUND_IMAGE, WEDDING_PHOTOS, APP_CONTENT } from '../constants';
import { Photo } from '../types';

export const ScrollExperience: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  
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
  const bookScale = useTransform(scrollYProgress, [0, 0.25, 0.7], [1.4, 1.4, 0.65]);
  const bookYOffset = useTransform(scrollYProgress, [0, 0.25, 0.7], ["-5%", "-5%", "15%"]);
  const bookXOffset = useTransform(scrollYProgress, [0.25, 0.7], ["0vw", "22vw"]);

  // Memoized wave configuration - Triggers compressed for 350vh height
  const waves = useMemo(() => [
    { photos: WEDDING_PHOTOS.slice(0, 3), trigger: 0.32 },
    { photos: WEDDING_PHOTOS.slice(4, 7), trigger: 0.40 },
    { photos: WEDDING_PHOTOS.slice(8, 11), trigger: 0.48 },
    { photos: WEDDING_PHOTOS.slice(12, 15), trigger: 0.56 },
    { photos: WEDDING_PHOTOS.slice(16, 20), trigger: 0.64 },
  ], []);

  const photoWaves = useMemo(() => {
    return waves.map((wave, waveIdx) => (
      <React.Fragment key={`wave-${waveIdx}`}>
        {wave.photos.map((photo, index) => (
          <FloatingPhoto 
            key={`photo-${photo.id}-${waveIdx}-${index}`}
            photo={photo}
            index={index}
            totalInWave={wave.photos.length}
            progress={scrollYProgress}
            triggerStart={wave.trigger}
            onSelect={setSelectedPhoto}
          />
        ))}
      </React.Fragment>
    ));
  }, [waves, scrollYProgress, setSelectedPhoto]);

  return (
    <div ref={containerRef} className="relative h-[350vh] w-full bg-transparent">
      
      <AnimatePresence>
        {selectedPhoto && (
          <Lightbox 
            photo={selectedPhoto} 
            allPhotos={WEDDING_PHOTOS}
            onClose={() => setSelectedPhoto(null)} 
            onPhotoChange={setSelectedPhoto}
          />
        )}
      </AnimatePresence>

      <div className="sticky top-0 h-[100vh] w-full overflow-hidden flex flex-col items-center justify-center transform-gpu">
        
        {/* Ambient Background Effects - Optimized for mobile */}
        <div className="absolute inset-0 z-0 pointer-events-none transform-gpu">
           <div className="absolute top-[-20%] left-[-20%] w-[80vw] h-[80vw] bg-rose-100/30 blur-[60px] md:blur-[120px] rounded-full mix-blend-multiply animate-pulse" />
           <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-sky-100/30 blur-[50px] md:blur-[100px] rounded-full mix-blend-multiply" />
        </div>

        <motion.div 
            style={{ scale: bgScale, y: bgY, opacity: bgOpacity }}
            className="absolute inset-0 z-0 overflow-hidden transform-gpu"
        >
            {/* 1. Base Image */}
            <img 
              src={BACKGROUND_IMAGE} 
              alt="Background" 
              className="w-full h-full object-cover object-center"
            />
            
            {/* 2. Cinematic Top Fade - Adjusted colors to match transparent BG */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/90 via-white/40 to-transparent z-10 pointer-events-none h-[45%]" />
            
            {/* 3. Bottom Fade */}
            <div className="absolute bottom-0 left-0 w-full h-[20%] bg-gradient-to-t from-white to-transparent z-10" />
        </motion.div>

        {/* Hero Text Content */}
        <motion.div 
          style={{ opacity: textOpacity, scale: textScale, filter: textBlur }}
          className="absolute top-[12%] md:top-[15%] z-30 flex flex-col items-center text-center px-6 pointer-events-none w-full max-w-4xl transform-gpu"
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
          
          {/* Scroll Indicator */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 1.2, duration: 1 }}
            style={{ y: chineseY, opacity: useTransform(scrollYProgress, [0, 0.1], [1, 0]) }}
            className="absolute top-[55vh] md:top-[60vh] pointer-events-auto"
          >
             <div className="flex flex-col items-center gap-3">
                <div className="px-5 py-2.5 rounded-full bg-white/30 backdrop-blur-md border border-white/40 shadow-lg flex items-center gap-2 animate-bounce">
                  <span className="w-1.5 h-1.5 bg-[#2c3e50] rounded-full animate-pulse" />
                  <span className="text-[#2c3e50] text-[10px] tracking-[0.25em] font-bold uppercase">往下滑動開啟</span>
                </div>
                <div className="h-12 w-[1px] bg-gradient-to-b from-[#2c3e50]/50 to-transparent" />
             </div>
          </motion.div>
        </motion.div>

        <motion.div 
            style={{ 
              opacity: bookContainerOpacity, 
              scale: bookScale, 
              y: bookYOffset,
              x: bookXOffset,
              perspective: '2500px' 
            }}
            className="absolute top-[45%] md:top-[50%] w-full flex items-center justify-center z-20 transform-gpu"
        >
          {/* Photos Stream */}
          <motion.div 
            style={{ x: "-12vw", transformStyle: 'preserve-3d' }}
            className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none z-20" 
          >
             {photoWaves}
          </motion.div>

          <div className="relative z-10" style={{ transformStyle: 'preserve-3d' }}>
            <BookCover 
              progress={scrollYProgress} 
              onSelectPhoto={setSelectedPhoto}
            />
          </div>
        </motion.div>
        
      </div>
    </div>
  );
};
