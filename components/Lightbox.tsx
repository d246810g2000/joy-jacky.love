
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
        className={`max-h-[48vh] md:max-h-[85vh] w-auto max-w-full object-contain rounded-[2px] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.25)] border border-white/60 cursor-default select-none relative z-10 bg-[#fdfbf7] ${isMobile ? '' : 'transform-gpu'}`}
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

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onPhotoChange) return;
    const index = Math.min(allPhotos.length - 1, Math.max(0, Number(e.target.value) - 1));
    onPhotoChange(allPhotos[index]);
  }, [allPhotos, onPhotoChange]);

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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#fdfbf7]/85 p-0 md:py-6 md:px-4 overflow-hidden"
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

      {/* 頂部固定區：單一列 = 上一張／下一張(手機) + 提示(手機) + 滑桿 + 關閉，節省空間 */}
      <motion.div 
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-[110] flex items-center gap-3 px-4 py-3 pt-[max(1rem,env(safe-area-inset-top))] pointer-events-auto bg-[#fdfbf7]/80 backdrop-blur-md border-b border-[#b08d55]/10"
      >
        {/* 手機版：上一張／下一張；電腦版留空 */}
        <div className="flex items-center gap-2 shrink-0">
          {hasMultiple && isMobile ? (
            <>
              <button
                type="button"
                onClick={handlePrev}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/90 border border-[#b08d55]/30 text-[#2c3e50] active:scale-95 hover:bg-white hover:border-[#b08d55]/50 transition-all shadow-sm backdrop-blur-md"
                aria-label="上一張"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/90 border border-[#b08d55]/30 text-[#2c3e50] active:scale-95 hover:bg-white hover:border-[#b08d55]/50 transition-all shadow-sm backdrop-blur-md"
                aria-label="下一張"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          ) : hasMultiple && !isMobile ? null : (
            <span className="w-[1px]" aria-hidden />
          )}
        </div>
        {/* 手機版：中央提示「左右滑動切換照片」；電腦版留空 */}
        {hasMultiple && isMobile && (
          <div className="flex items-center justify-center text-[#b08d55] opacity-70 pointer-events-none shrink-0">
            <span className="text-[11px] tracking-[0.2em] font-serif whitespace-nowrap">左右滑動切換照片</span>
          </div>
        )}
        {hasMultiple && !isMobile && <div className="w-0 min-w-0 shrink" aria-hidden />}
        {/* 滑桿與關閉鈕同一列；單張時留空撐開 */}
        {hasMultiple ? (
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-[9px] text-stone-400 font-mono w-4 shrink-0">1</span>
            <input
              type="range"
              min={1}
              max={allPhotos.length}
              value={currentIndex + 1}
              onChange={handleSliderChange}
              className="flex-1 h-1.5 min-w-0 appearance-none bg-stone-200/60 rounded-full cursor-pointer accent-[#b08d55] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#b08d55] [&::-webkit-slider-thumb]:shadow-[0_0_0_2px_#fdfbf7] [&::-webkit-slider-thumb]:cursor-grab [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#b08d55] [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-grab"
              aria-label="跳至第幾張照片"
            />
            <span className="text-[9px] text-stone-400 font-mono w-4 shrink-0 text-right">{allPhotos.length}</span>
            <span className="text-[9px] text-stone-400 font-display tracking-wider shrink-0 hidden sm:inline">第 {String(currentIndex + 1).padStart(2, '0')} / {allPhotos.length}</span>
          </div>
        ) : (
          <div className="min-w-0 flex-1" aria-hidden />
        )}
        <motion.button 
          initial={{ opacity: 0, rotate: -90 }}
          animate={{ opacity: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
          onClick={onClose}
          className="relative w-10 h-10 flex items-center justify-center rounded-full text-[#2c3e50]/40 hover:text-[#2c3e50] hover:bg-black/5 transition-all group shrink-0"
          aria-label="Close Lightbox"
        >
          <div className="relative w-6 h-6">
            <span className="absolute top-1/2 left-0 w-full h-px bg-current rotate-45 transition-transform group-hover:scale-x-110" />
            <span className="absolute top-1/2 left-0 w-full h-px bg-current -rotate-45 transition-transform group-hover:scale-x-110" />
          </div>
          <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity font-display uppercase whitespace-nowrap">關閉</span>
        </motion.button>
      </motion.div>

      {/* 電腦版：上一張／下一張在整個頁面的最左與最右，不擋照片與文字 */}
      {!isMobile && hasMultiple && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="fixed left-4 md:left-6 top-1/2 -translate-y-1/2 z-[105] w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-full bg-white/90 border border-[#b08d55]/30 text-[#2c3e50] hover:bg-white hover:border-[#b08d55]/50 active:scale-95 transition-all shadow-lg backdrop-blur-md pointer-events-auto"
            aria-label="上一張"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="fixed right-4 md:right-6 top-1/2 -translate-y-1/2 z-[105] w-12 h-12 md:w-14 md:h-14 flex items-center justify-center rounded-full bg-white/90 border border-[#b08d55]/30 text-[#2c3e50] hover:bg-white hover:border-[#b08d55]/50 active:scale-95 transition-all shadow-lg backdrop-blur-md pointer-events-auto"
            aria-label="下一張"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      <motion.div 
        initial={{ y: 20, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -20, opacity: 0, scale: 0.95, filter: "blur(10px)", transition: { duration: 0.3, ease: "easeIn" } }}
        className={`relative w-full max-w-6xl h-full flex flex-col items-center justify-center gap-2 md:gap-6 pointer-events-none px-3 md:px-0 overflow-y-auto md:overflow-visible pb-[env(safe-area-inset-bottom)] pt-16 md:pt-18 ${!isMobile ? 'md:flex-row md:items-center md:gap-8 md:max-w-[calc(100vw-11rem)] md:w-full' : ''}`}
      >

        {/* 電腦版：照片左側，橫向照佔更寬以發揮寬螢幕優勢；手機版：照片在上 */}
        <motion.div 
          className={`relative w-full flex justify-center items-center pointer-events-auto max-h-[48vh] touch-pan-y shrink-0 ${!isMobile ? (photo.orientation === 'landscape' ? 'md:max-h-[75vh] md:flex-[1_1_80%] md:min-w-0' : 'md:max-h-[70vh] md:flex-[1_1_55%] md:min-w-0') : 'md:max-h-[60vh]'} ${isMobile ? '' : 'perspective-[1500px]'}`}
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

        {/* 電腦版：標題與文字右側垂直置中，橫向照時右側較窄以讓照片更寬；手機版：照片下方 */}
        <div className={`w-full max-w-2xl flex-shrink-0 text-left pointer-events-auto bg-white/30 md:bg-transparent p-3 md:px-0 md:pl-4 pb-5 md:pb-0 rounded-sm md:rounded-none backdrop-blur-md md:backdrop-blur-none z-50 flex flex-col justify-center min-h-0 ${!isMobile ? (photo.orientation === 'landscape' ? 'md:max-w-none md:flex-[0_1_18%] md:pt-0' : 'md:max-w-none md:flex-[0_1_38%] md:pt-0') : 'md:pt-2'}`}>
            {/* Animated Content */}
            <AnimatePresence mode="wait">
                <motion.div 
                    key={photo.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
                    className="space-y-3 md:space-y-6"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div>
                        <h2 className="font-serif text-2xl md:text-3xl text-[#b08d55] italic leading-tight min-h-0 md:min-h-[4rem] flex items-center">
                            {photo.title || photo.alt}
                        </h2>
                    </div>

                    <div>
                      <p className="text-[#7f8c8d] text-sm md:text-base leading-relaxed font-light italic opacity-75 line-clamp-3 md:line-clamp-none">
                        {photo.description ?? "每一個眼神，都是我們永恆故事的開始。"}
                      </p>
                    </div>
                </motion.div>
            </AnimatePresence>
            
            {/* Persistent Metadata：國家／地點（拖曳滑桿已移至頂部） */}
            <div className="mt-4 md:mt-8 pt-4 md:pt-6 border-t border-[#b08d55]/20" onClick={(e) => e.stopPropagation()}>
                <div className="grid grid-cols-2 gap-3 md:gap-4 text-[10px] text-stone-500 font-mono">
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

    </motion.div>
  );
};
