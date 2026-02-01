
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
  isMobile: boolean;
}

export const FloatingPhoto = React.memo(({ photo, index, totalInWave, progress, triggerStart, onSelect, isMobile }: FloatingPhotoProps) => {
  const isPortrait = photo.orientation === 'portrait';
  
  // Adjusted for 350vh total height:
  // Reduced delay spacing to ensure group stays together
  const delay = index * 0.03; 
  const start = triggerStart + delay;
  // 單張飛出動畫佔用的 scroll 區間（較大 = 飛出較慢）
  const duration = 0.34; 
  const end = start + duration;

  // 1. Scale
  const endScale = isMobile ? 3.0 : 5.0;
  const scale = useTransform(progress, [start, end], [0.1, endScale]); 
  
  // 2. Opacity
  const opacity = useTransform(progress, [start, start + 0.05, end - 0.01, end], [0, 1, 1, 0]);
  
  // 3. X Transform
  // Increase horizontal spread to allow photos to fly further left and right
  const spreadFactor = isMobile ? 0.8 : 0.9;

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
  const z = useTransform(progress, [start, end], isMobile ? [0, 0] : [0, 1000]);

  // 6. Rotation（電腦版最多 ±10 度，手機不旋轉）
  const rotationDir = index % 2 === 0 ? 1 : -1;
  const rotateZ = useTransform(progress, [start, end], isMobile ? [0, 0] : [rotationDir * -10, rotationDir * 10]);

  // Width adjustments - 放大飛出照片的寬度
  const widthClasses = isPortrait 
    ? "w-[32vw] max-w-[180px] md:w-[14vw] md:max-w-[180px]" 
    : "w-[40vw] max-w-[230px] md:w-[18vw] md:max-w-[240px]";

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
        willChange: isMobile ? 'transform, opacity' : 'auto'
      }}
      className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${widthClasses} origin-center pointer-events-none ${isMobile ? '' : 'transform-gpu'}`}
    >
      <div 
        className={`relative p-[1.5px] bg-white shadow-xl rounded-[1px] ${isMobile ? '' : 'transform-gpu backface-hidden'} border-[0.5px] border-white/40 cursor-pointer pointer-events-auto hover:scale-105 transition-transform duration-500`}
        style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
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
