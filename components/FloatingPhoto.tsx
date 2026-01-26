
import React, { useMemo } from 'react';
import { motion, useTransform } from 'framer-motion';
import type { MotionValue } from 'framer-motion';
import { Photo } from '../types';

interface FloatingPhotoProps {
  photo: Photo;
  index: number;      
  totalInWave: number; 
  progress: MotionValue<number>;
  triggerStart: number; 
  onSelect: (photo: Photo) => void; 
}

export const FloatingPhoto = React.memo(({ photo, index, totalInWave, progress, triggerStart, onSelect }: FloatingPhotoProps) => {
  const isPortrait = photo.orientation === 'portrait';
  
  // Adjusted for 350vh total height:
  // Reduced delay spacing to ensure group stays together
  const delay = index * 0.05; 
  const start = triggerStart + delay;
  // Reduced duration to match faster scroll
  const duration = 0.25; 
  const end = start + duration;

  // 1. Scale
  const scale = useTransform(progress, [start, end], [0.1, 5.0]); 
  
  // 2. Opacity
  const opacity = useTransform(progress, [start, start + 0.05, end - 0.01, end], [0, 1, 1, 0]);
  
  // 3. X Transform
  // Check for desktop width to constrain spread
  const isDesktop = typeof window !== 'undefined' && window.innerWidth > 768;
  const spreadFactor = isDesktop ? 0.6 : 1.0; // Reduce spread by 40% on desktop

  const side = index % 2 === 0 ? 1 : -1; 
  const tier = index % 3; 
  const r1 = ((index * 137.5) % 100) / 100; 
  const r2 = ((index * 293.3) % 100) / 100;
  const baseDist = 30 + (tier * 30); 
  const variance = r1 * 20;
  const finalDist = baseDist + variance;
  
  // Apply spreadFactor to pull items closer to center on wide screens
  const xEnd = `${side * finalDist * spreadFactor}vw`;
  const x = useTransform(progress, [start, end], ["0vw", xEnd]);
  
  // 4. Y Position
  const startY = (r2 * 10) - 5; 
  const endY = -180 - (r1 * 50); 
  const y = useTransform(progress, [start, end], [`${startY}vh`, `${endY}vh`]);
  
  // 5. Z Depth
  const z = useTransform(progress, [start, end], [0, 1000]);

  // 6. Rotation
  const initialRot = (r2 - 0.5) * 40; 
  const rotateSpeed = 45 + (r1 * 45); 
  const rotationDir = index % 2 === 0 ? 1 : -1;
  const rotateZ = useTransform(progress, [start, end], [initialRot, initialRot + (rotationDir * rotateSpeed)]);

  // Width adjustments - Reduced max-width for desktop to be less overwhelming and fit within height
  const widthClasses = isPortrait 
    ? "w-[22vw] max-w-[140px] md:w-[12vw] md:max-w-[150px]" 
    : "w-[28vw] max-w-[180px] md:w-[16vw] md:max-w-[200px]";

  return (
    <motion.div
      style={{
        scale,
        opacity,
        x,
        y,
        z,
        rotateZ,
        zIndex: 100 + index, 
      }}
      className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${widthClasses} origin-center pointer-events-none will-change-transform`}
    >
      <div 
        className="relative p-[1.5px] bg-white shadow-xl rounded-[1px] transform-gpu backface-hidden border-[0.5px] border-white/40 cursor-pointer pointer-events-auto hover:scale-105 transition-transform duration-500"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(photo);
        }}
      >
        <div className={`relative overflow-hidden bg-stone-100 ${isPortrait ? 'aspect-[3/4]' : 'aspect-[4/3]'}`}>
           <img 
            src={photo.url} 
            alt={photo.alt} 
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        {/* Subtle reflective overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-40 pointer-events-none" />
      </div>
    </motion.div>
  );
});
