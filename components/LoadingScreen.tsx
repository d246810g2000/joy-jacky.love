
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingScreenProps {
  progress: number;
  isMobile: boolean;
  onComplete: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress, isMobile, onComplete }) => {
  const isLoaded = progress >= 100;

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 1, ease: "easeInOut" } }}
      style={{ willChange: isMobile ? 'opacity' : 'auto' }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-r from-[#fff0f5] to-[#f0f9ff] overflow-hidden"
    >
      {/* Background Dreamy Elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 180, 270, 360],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{ willChange: isMobile ? 'transform, opacity' : 'auto' }}
          className="absolute -top-[10%] -left-[10%] w-[60vw] h-[60vw] bg-rose-100/40 blur-[100px] rounded-full"
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            rotate: [360, 270, 180, 90, 0],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          style={{ willChange: isMobile ? 'transform, opacity' : 'auto' }}
          className="absolute -bottom-[10%] -right-[10%] w-[70vw] h-[70vw] bg-sky-100/30 blur-[120px] rounded-full"
        />
      </div>

      {/* Main Content Container with 3D Perspective */}
      <div 
        className="relative z-10 flex flex-col items-center" 
        style={{ perspective: isMobile ? 'none' : '1000px' }}
      >
        {/* Floating 3D Heart/Icon */}
        <motion.div
          animate={{ 
            y: [0, -20, 0],
            rotateY: isMobile ? [0, 0] : [0, 360],
            rotateX: isMobile ? [0, 0] : [10, -10, 10]
          }}
          transition={{ 
            y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
            rotateY: { duration: 8, repeat: Infinity, ease: "linear" },
            rotateX: { duration: 4, repeat: Infinity, ease: "easeInOut" }
          }}
          style={{ 
            transformStyle: isMobile ? 'flat' : 'preserve-3d',
            willChange: isMobile ? 'transform' : 'auto'
          }}
          className="mb-12"
        >
          <div className="relative w-24 h-24 flex items-center justify-center">
            {/* 3D Wax Seal Style Icon */}
            <div className="absolute inset-0 bg-[#8E3535] rounded-full shadow-xl opacity-20 blur-md scale-110" />
            <div className="relative w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(142,53,53,0.15),inset_0_2px_10px_rgba(0,0,0,0.05)] border-2 border-[#b08d55]/30 overflow-hidden">
              <img src="favicon.png" alt="Joy & Jacky" className="w-full h-full object-cover" />
              
              {/* Shine Effect */}
              <motion.div 
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]"
              />
            </div>
          </div>
        </motion.div>

        {/* Text and Progress */}
        <div className="text-center space-y-6 px-8 max-w-sm">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className="font-serif text-xl md:text-2xl text-[#2c3e50] tracking-[0.3em] mb-2">
              Joy & Jacky
            </h2>
            <p className="font-display text-[10px] text-[#b08d55] uppercase tracking-[0.4em]">
              Wedding Invitation
            </p>
          </motion.div>

          {/* Progress Bar Container */}
          <div className="relative w-64 h-[2px] bg-stone-200 overflow-hidden rounded-full mx-auto">
            <motion.div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#b08d55] to-[#8E3535]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          
          <motion.p 
            className="font-mono text-[10px] text-[#8a6a3d] tracking-widest tabular-nums"
          >
            {Math.round(progress)}%
          </motion.p>
        </div>

        {/* Interaction Button after 100% */}
        <div className="mt-12 h-16 flex items-center justify-center">
          <AnimatePresence>
            {isLoaded && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                onClick={() => {
                  window.scrollTo(0, 0);
                  onComplete();
                }}
                className="group relative px-10 py-4 bg-[#8E3535] text-white rounded-[2px] shadow-lg overflow-hidden transition-all hover:scale-105 active:scale-95"
              >
                <span className="relative z-10 font-serif tracking-[0.4em] text-sm pl-[0.4em]">
                  開啟邀請函
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#8E3535] via-[#a84d4d] to-[#8E3535] bg-[length:200%_100%] animate-shimmer" />
                
                {/* Decoration corners */}
                <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-white/30" />
                <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-white/30" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Text */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ delay: 1 }}
        className="absolute bottom-10 text-[9px] text-[#2c3e50] uppercase tracking-[0.5em]"
      >
        Loading the magic...
      </motion.div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite linear;
        }
      `}</style>
    </motion.div>
  );
};
