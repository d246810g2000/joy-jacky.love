
import React, { useMemo, useState } from 'react';
import { motion, useTransform } from 'framer-motion';
import type { MotionValue } from 'framer-motion';
import { Photo } from '../types';

/** 相簿書脊在 Photos Stream 座標下的約略 X（從左側飛出時的起點） */
const SPINE_X_VW = -2;

interface FloatingPhotoProps {
  photo: Photo;
  index: number;
  totalInWave: number;
  progress: MotionValue<number>;
  triggerStart: number;
  onSelect: (photo: Photo) => void;
  onHoverChange?: (hovering: boolean) => void;
  /** 若為 true，從相簿左側（書點）位置起飛 */
  startFromSpine?: boolean;
  isMobile: boolean;
  zIndex: number;
}

export const FloatingPhoto = React.memo(({ photo, index, totalInWave, progress, triggerStart, onSelect, onHoverChange, startFromSpine = false, isMobile, zIndex }: FloatingPhotoProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const isPortrait = photo.orientation === 'portrait';

  // --- 1. Stable Pseudo-random Seeds (Fixed per component instance) ---
  const { r1, r2, r3, r4, flightParams, startOffset } = useMemo(() => {
    const s1 = ((index * 137.5) % 100) / 100;
    const s2 = ((index * 293.3) % 100) / 100;
    const s3 = ((index * 457.1) % 100) / 100;
    const s4 = ((index * 563.9) % 100) / 100;

    // Flight Timing
    const baseDelay = index * 0.025; // 稍微調緊間隔
    const randomDelay = s1 * 0.02;
    const baseDuration = isMobile ? 0.34 : 0.32; // 調快飛出速度 (0.4 -> 0.32)
    const randomDuration = isMobile ? 0 : (s2 * 0.08);

    // Initial Position (Offsets from album center in vw)
    const options = [-13, -7, -2, 2, 8, 14];
    const initialX = startFromSpine ? SPINE_X_VW : options[index % options.length];

    // Side: 1=right, -1=left, 小數=微傾斜向上 (依要求：第二波向上偏左，第三波向上偏右)
    const sides = [1, -1, -0.18, 1, -1, 1, -1, 0.18, 0, 1];
    const side = sides[index % sides.length];

    return {
      r1: s1, r2: s2, r3: s3, r4: s4,
      flightParams: { delay: baseDelay + randomDelay, duration: baseDuration + randomDuration, side },
      startOffset: initialX
    };
  }, [index, isMobile, startFromSpine]);

  const start = triggerStart + flightParams.delay;
  const end = start + flightParams.duration;

  // --- 2. Motion Transforms ---

  // Scale: Extremely small to large
  const endScale = isMobile ? 3.0 : (3.5 + r3 * 1.5);
  const scale = useTransform(progress, [start, end], [0.01, endScale]);

  // Opacity: Fade in quickly, hold, fade out at end
  const opacity = useTransform(progress, [start, start + 0.04, end - 0.02, end], [0, 1, 1, 0]);

  // X Transform: Starting from album page, spreading out horizontally
  const spreadFactor = isMobile ? 1.3 : (1.1 + r1 * 0.4);
  const tier = index % 4;
  const baseDist = isMobile ? (35 + (tier * 25)) : (45 + (tier * 35));
  const finalDist = (baseDist + (r2 * 30)) * spreadFactor;
  const xTarget = flightParams.side * finalDist;

  // 手機版使用極簡線性路徑以節省效能；電腦版保留靈動擺盪 (Flutter)
  const x = useTransform(
    progress,
    isMobile ? [start, end] : [start, start + flightParams.duration * 0.3, start + flightParams.duration * 0.65, end],
    isMobile ? [`${startOffset}vw`, `${xTarget}vw`] : [
      `${startOffset}vw`,
      `${(startOffset + xTarget * 0.3) + (r4 * 5 - 2.5)}vw`,
      `${(startOffset + xTarget * 0.7) - (r4 * 4 - 2)}vw`,
      `${xTarget}vw`
    ]
  );

  // Y Position: Parabolic Trajectory
  const startY = isMobile ? ((r2 * 10) - 5) : ((r4 * 12) - 6);
  const peakY = isMobile ? -50 : (-80 - (r1 * 40));
  const endY = isMobile ? (-180 - (r1 * 50)) : (-200 - (r2 * 120));

  const y = useTransform(
    progress,
    isMobile ? [start, end] : [start, start + flightParams.duration * 0.45, end],
    isMobile ? [`${startY}vh`, `${endY}vh`] : [`${startY}vh`, `${peakY}vh`, `${endY}vh`]
  );

  // Rotation: 手機版回歸單調旋轉以節省運算；電腦版保留靈動回彈
  const rotationDir = index % 2 === 0 ? 1 : -1;
  const baseRot = 6 + (r1 * 4); // 限制在 +-10 度內
  const rotateZ = useTransform(
    progress,
    isMobile ? [start, end] : [start, start + flightParams.duration * 0.35, start + flightParams.duration * 0.75, end],
    isMobile ? [rotationDir * -3, rotationDir * baseRot] : [
      rotationDir * -3,
      rotationDir * (baseRot * 0.7),
      rotationDir * (baseRot * 0.4),
      rotationDir * baseRot
    ]
  );

  const display = useTransform(progress, v => (v >= start && v <= end ? 'block' : 'none'));

  // 動態柔和陰影：手機版使用固定陰影減少渲染負擔
  const shadowValue = isMobile
    ? "0px 10px 25px rgba(0,0,0,0.15)"
    : useTransform(progress, [start, end], [
      "0px 4px 12px rgba(0,0,0,0.1)",
      `${12 + r1 * 10}px ${25 + r2 * 15}px ${40 + r3 * 20}px rgba(0,0,0,0.06)`
    ]);

  // --- 3. UI Helpers ---
  const widthClasses = isPortrait
    ? "w-[32vw] max-w-[180px] md:w-[14.5vw] md:max-w-[190px]"
    : "w-[40vw] max-w-[230px] md:w-[19vw] md:max-w-[260px]";

  const titleText = photo.title || photo.alt || '';
  const titleChars = useMemo(() => Array.from(titleText), [titleText]);

  return (
    <motion.div
      style={{
        scale,
        opacity,
        display,
        x,
        y,
        rotateZ,
        zIndex,
        willChange: isMobile ? 'transform, opacity' : 'auto'
      }}
      className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${widthClasses} origin-center pointer-events-none ${isMobile ? '' : 'transform-gpu'}`}
    >
      <motion.div
        className={`relative p-[1.5px] bg-white rounded-[1px] ${isMobile ? '' : 'transform-gpu backface-hidden'} border-[0.5px] border-white/40 cursor-pointer pointer-events-auto hover:scale-105 transition-transform duration-500`}
        style={{
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          boxShadow: shadowValue
        }}
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
        {/* Subtle reflective overlay - Disable on mobile */}
        {!isMobile && <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-40 pointer-events-none" />}
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
      </motion.div>
    </motion.div>
  );
});
