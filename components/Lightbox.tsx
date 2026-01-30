
import React, { useEffect, useCallback, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { Photo } from '../types';

interface LightboxProps {
  photo: Photo;
  allPhotos?: Photo[];
  onClose: () => void;
  onPhotoChange?: (photo: Photo) => void;
}

interface LightboxImageProps {
  photo: Photo;
  rotateX: any;
  rotateY: any;
  isMobile: boolean;
}

const LightboxImage: React.FC<LightboxImageProps> = ({ photo, rotateX, rotateY, isMobile }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <motion.div
      className="relative flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
    >
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
            <div className="w-10 h-10 border-[3px] border-stone-200 border-t-[#b08d55] rounded-full animate-spin" />
        </div>
      )}
      <motion.img
        src={photo.url}
        alt={photo.alt}
        onLoad={() => setIsLoaded(true)}
        
        initial={{ opacity: 0, scale: 0.96, filter: "blur(8px)" }}
        animate={{ 
            opacity: isLoaded ? 1 : 0, 
            scale: isLoaded ? 1 : 0.96,
            filter: isLoaded ? "blur(0px)" : "blur(8px)"
        }}
        
        style={isMobile ? { 
          // 手機端：完全移除 3D 變換，只保留簡單的 2D 效果
          willChange: 'transform, opacity'
        } : { 
          // 桌面端：保留 3D 懸停效果
          rotateX, 
          rotateY, 
          transformStyle: 'preserve-3d'
        }}
        className={`max-h-[70vh] md:max-h-[85vh] w-auto max-w-full object-contain rounded-[2px] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.25)] border border-white/60 cursor-default select-none relative z-10 bg-[#fdfbf7] ${isMobile ? '' : 'transform-gpu'}`}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }} 
        onClick={(e) => e.stopPropagation()}
      />
    </motion.div>
  );
};

export const Lightbox: React.FC<LightboxProps & { isMobile: boolean }> = ({ photo, allPhotos = [], onClose, onPhotoChange, isMobile }) => {
  // Lock body scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  // --- Navigation Logic ---
  const currentIndex = allPhotos.findIndex(p => p.id === photo.id);
  const hasMultiple = allPhotos.length > 1;

  const handleNext = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!onPhotoChange || !hasMultiple) return;
    const nextIndex = (currentIndex + 1) % allPhotos.length;
    onPhotoChange(allPhotos[nextIndex]);
  }, [currentIndex, allPhotos, onPhotoChange, hasMultiple]);

  const handlePrev = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!onPhotoChange || !hasMultiple) return;
    const prevIndex = (currentIndex - 1 + allPhotos.length) % allPhotos.length;
    onPhotoChange(allPhotos[prevIndex]);
  }, [currentIndex, allPhotos, onPhotoChange, hasMultiple]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, handleNext, handlePrev]);

  // --- 3D Hover Effect Logic (桌面端專用) ---
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 250, damping: 25 });
  const mouseYSpring = useSpring(y, { stiffness: 250, damping: 25 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [10, -10]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [-10, 10]);

  // 手機端跳過鼠標事件處理，減少計算開銷
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isMobile) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const xPct = (mouseX / width) - 0.5;
    const yPct = (mouseY / height) - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
      animate={{ opacity: 1, backdropFilter: "blur(24px)" }}
      exit={{ opacity: 0, backdropFilter: "blur(0px)", transition: { duration: 0.4, ease: "easeInOut" } }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#fdfbf7]/85 p-0 md:p-8 overflow-hidden"
    >
      {/* Background Sparkles & Glow */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" 
      />
      
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.5 }}
        exit={{ scale: 1.2, opacity: 0 }}
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.9)_0%,transparent_70%)]" 
      />

      <motion.div 
        initial={{ y: 20, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -20, opacity: 0, scale: 0.95, filter: "blur(10px)", transition: { duration: 0.3, ease: "easeIn" } }}
        className="relative w-full max-w-6xl h-full flex flex-col md:flex-row items-center justify-center gap-8 pointer-events-none px-4 md:px-0"
      >
        
        {/* Navigation Button Left */}
        {hasMultiple && (
          <button 
            onClick={handlePrev}
            className="absolute left-2 md:-left-16 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/40 border border-[#b08d55]/20 text-[#2c3e50] hover:bg-white hover:border-[#b08d55]/50 hover:scale-110 transition-all pointer-events-auto shadow-sm z-50 backdrop-blur-md hidden md:flex"
            aria-label="Previous Photo"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* The Image Wrapper */}
        <motion.div 
          className={`relative w-full md:w-auto md:flex-1 flex justify-center items-center pointer-events-auto max-h-[70vh] md:max-h-full touch-pan-y ${isMobile ? '' : 'perspective-[1500px]'}`}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(_, info) => {
            if (info.offset.x > 100) handlePrev();
            else if (info.offset.x < -100) handleNext();
          }}
        >
          {isMobile && hasMultiple && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 1 }}
              className="absolute -bottom-6 left-[-1rem] right-[-1rem] flex items-center justify-center gap-4 text-[#b08d55] opacity-60 z-[60] pointer-events-none whitespace-nowrap"
            >
              <motion.span
                animate={{ x: [-4, 4, -4] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="text-xs"
              >
                ←
              </motion.span>
              <span className="text-[11px] tracking-[0.2em] font-serif mr-[-0.2em]">左右滑動切換照片</span>
              <motion.span
                animate={{ x: [4, -4, 4] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="text-xs"
              >
                →
              </motion.span>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            <LightboxImage 
                key={photo.id} 
                photo={photo} 
                rotateX={rotateX} 
                rotateY={rotateY} 
                isMobile={isMobile}
            />
          </AnimatePresence>
        </motion.div>

        {/* Navigation Button Right */}
        {hasMultiple && (
          <button 
            onClick={handleNext}
            className="absolute right-2 md:-right-16 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-white/40 border border-[#b08d55]/20 text-[#2c3e50] hover:bg-white hover:border-[#b08d55]/50 hover:scale-110 transition-all pointer-events-auto shadow-sm z-50 backdrop-blur-md hidden md:flex"
            aria-label="Next Photo"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Metadata Sidebar - Persistent Container */}
        <div className="w-full md:w-80 flex-shrink-0 text-left pointer-events-auto bg-white/30 md:bg-transparent p-4 md:p-0 rounded-sm md:rounded-none backdrop-blur-md md:backdrop-blur-none z-50 flex flex-col justify-center">
            {/* Animated Content */}
            <AnimatePresence mode="wait">
                <motion.div 
                    key={photo.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
                    className="space-y-6"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="h-px w-6 bg-[#b08d55]" />
                            <span className="font-display text-[10px] tracking-[0.2em] text-[#b08d55] uppercase">
                            精彩瞬間
                            </span>
                        </div>
                        <h2 className="font-serif text-3xl text-[#2c3e50] italic leading-tight min-h-[4rem] flex items-center">
                            {photo.title || photo.alt}
                        </h2>
                    </div>

                    <div className="hidden md:block">
                      <p className="text-[#7f8c8d] text-xs leading-relaxed font-light italic opacity-75">
                        {photo.description ? `"${photo.description}"` : "每一個眼神，都是我們永恆故事的開始。"}
                      </p>
                    </div>
                </motion.div>
            </AnimatePresence>
            
            {/* Persistent Metadata & Progress Bar */}
            <div className="mt-8 pt-6 border-t border-[#b08d55]/20" onClick={(e) => e.stopPropagation()}>
                
                {/* Visual Progress Bar */}
                <div className="mb-6">
                    <div className="flex items-end justify-between mb-2 font-mono">
                        <span className="text-[10px] text-[#b08d55] font-bold tracking-widest">
                            {String(currentIndex + 1).padStart(2, '0')}
                        </span>
                        <span className="text-[10px] text-stone-400 tracking-widest">
                            {String(allPhotos.length).padStart(2, '0')}
                        </span>
                    </div>
                    <div className="w-full h-[1px] bg-stone-300/40 relative">
                        <motion.div 
                            className="absolute top-0 left-0 h-full bg-[#b08d55]"
                            initial={false}
                            animate={{ width: `${((currentIndex + 1) / allPhotos.length) * 100}%` }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                    </div>
                </div>

                {/* Static Grid：國家與地點 */}
                <div className="grid grid-cols-2 gap-4 text-[10px] text-stone-500 font-mono">
                    <div>
                        <p className="uppercase tracking-widest text-[#7f8c8d] mb-1">國家／地區</p>
                        <p className="text-[#2c3e50] font-medium">{photo.country ?? "—"}</p>
                    </div>
                    <div>
                        <p className="uppercase tracking-widest text-[#7f8c8d] mb-1">地點</p>
                        <p className="text-[#2c3e50] font-medium">{photo.location ?? "—"}</p>
                    </div>
                </div>
            </div>
        </div>

      </motion.div>

      {/* Refined Close Button */}
      <motion.button 
        initial={{ opacity: 0, rotate: -90 }}
        animate={{ opacity: 1, rotate: 0 }}
        exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
        onClick={onClose}
        className="absolute top-6 right-6 md:top-12 md:right-12 w-10 h-10 flex items-center justify-center rounded-full text-[#2c3e50]/40 hover:text-[#2c3e50] hover:bg-black/5 transition-all pointer-events-auto z-[110] group"
        aria-label="Close Lightbox"
      >
        <div className="relative w-6 h-6">
          <span className="absolute top-1/2 left-0 w-full h-px bg-current rotate-45 transition-transform group-hover:scale-x-110" />
          <span className="absolute top-1/2 left-0 w-full h-px bg-current -rotate-45 transition-transform group-hover:scale-x-110" />
        </div>
        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity font-display uppercase">關閉</span>
      </motion.button>

    </motion.div>
  );
};
