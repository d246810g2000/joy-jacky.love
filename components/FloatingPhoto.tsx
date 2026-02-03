
import React, { useMemo, useState } from 'react';
import { motion, useTransform } from 'framer-motion';
import type { MotionValue } from 'framer-motion';
import { Photo } from '../types';

/** 相簿書脊在 Photos Stream 座標下的約略 X（從左側飛出時的起點） */
const SPINE_X_VW = -18;

interface FloatingPhotoProps {
  photo: Photo;
  index: number;      
  totalInWave: number; 
  progress: MotionValue<number>;
  triggerStart: number; 
  onSelect: (photo: Photo) => void; 
  onHoverChange?: (hovering: boolean) => void;
  /** 若為 true，從相簿左側（書脊）位置起飛 */
  startFromSpine?: boolean;
  isMobile: boolean;
}

export const FloatingPhoto = React.memo(({ photo, index, totalInWave, progress, triggerStart, onSelect, onHoverChange, startFromSpine = false, isMobile }: FloatingPhotoProps) => {
  const [isHovered, setIsHovered] = useState(false);
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
  const xStart = startFromSpine ? `${SPINE_X_VW}vw` : "0vw";
  const x = useTransform(progress, [start, end], [xStart, xEnd]);
  
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

  const titleText = photo.title || photo.alt || '';
  const titleChars = useMemo(() => Array.from(titleText), [titleText]);

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
        onMouseEnter={() => {
          setIsHovered(true);
          onHoverChange?.(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          onHoverChange?.(false);
        }}
      >
        <div className={`relative overflow-hidden bg-stone-100 ${isPortrait ? 'aspect-[3/4]' : 'aspect-[4/3]'}`}>
           <img 
            src={photo.compressedUrl ?? photo.url} 
            alt={photo.alt} 
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>
        {/* Subtle reflective overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-40 pointer-events-none" />
        {/* 電腦版：滑鼠懸停時透明流光，高級優雅的珍珠光澤 */}
        {!isMobile && isHovered && (
          <motion.div
            className="absolute inset-0 pointer-events-none z-10 rounded-[1px] overflow-hidden"
            initial={false}
          >
            <motion.div
              className="absolute inset-0 w-[45%] bg-gradient-to-r from-transparent via-white/[0.18] to-transparent"
              animate={{ x: ['-100%', '220%'] }}
              transition={{ repeat: Infinity, duration: 2.8, ease: [0.4, 0, 0.2, 1], repeatDelay: 1.2 }}
            />
            <motion.div
              className="absolute inset-0 w-[35%] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent"
              animate={{ x: ['-100%', '250%'] }}
              transition={{ repeat: Infinity, duration: 3.4, ease: [0.4, 0, 0.2, 1], repeatDelay: 1.6 }}
            />
          </motion.div>
        )}
        {/* 電腦版：滑鼠懸停時標題逐字浮現，婚紗藝廊樣式，底部漸層不擋照片 */}
        {!isMobile && isHovered && titleText && (
          <motion.div
            className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none overflow-hidden rounded-b-[1px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="bg-gradient-to-t from-black/80 via-black/50 to-transparent pt-6 pb-1.5 px-2.5 min-h-[2.25rem] flex items-end justify-center">
              <p className="font-serif italic text-[11px] leading-tight text-white/95 text-center line-clamp-2 break-words drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] [text-shadow:0_0_12px_rgba(0,0,0,0.6)]">
                {titleChars.map((char, i) => (
                  <motion.span
                    key={`${i}-${char}`}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
                    className="inline-block"
                  >
                    {char}
                  </motion.span>
                ))}
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
});
