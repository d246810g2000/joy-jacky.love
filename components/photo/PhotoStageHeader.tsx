import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { WeddingStage } from '../../types';
import { getStageFilmMarker } from '../../utils/weddingFilm';
import { useIsMobile } from '../../hooks/useIsMobile';

interface PhotoStageHeaderProps {
  stage: WeddingStage;
  photoCount: number;
  visibleCount?: number;
  index: number;
  onWatchVideo: (stageId: string) => void;
}

export const PhotoStageHeader: React.FC<PhotoStageHeaderProps> = ({
  stage,
  photoCount,
  visibleCount,
  index,
  onWatchVideo,
}) => {
  const isMobile = useIsMobile();
  const [descOpen, setDescOpen] = useState(!isMobile);
  const marker = getStageFilmMarker(stage.id);
  const accent = marker?.accent ?? '#B08D55';
  const countLabel =
    visibleCount != null && visibleCount < photoCount
      ? `已顯示 ${visibleCount} / 共 ${photoCount} 張`
      : `${photoCount} 張照片`;

  return (
    <motion.header
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10%' }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="photo-stage-header relative mb-6 overflow-hidden rounded-2xl border border-white/10 px-5 py-6 md:px-8 md:py-8"
      style={{
        background: `linear-gradient(135deg, ${accent}18 0%, rgba(20,18,16,0.85) 55%, rgba(12,11,10,0.92) 100%)`,
        boxShadow: `0 0 60px ${accent}15`,
      }}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-30 blur-3xl"
        style={{ background: accent }}
        aria-hidden
      />

      <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <p className="font-mono text-xs tracking-[0.2em] text-white/45">
            CHAPTER {String(index + 1).padStart(2, '0')}
          </p>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span
              className="font-mono text-2xl font-light tabular-nums text-white/90 md:text-3xl"
              style={{ color: accent }}
            >
              {stage.time}
            </span>
            <h2 className="font-serif text-2xl text-white md:text-3xl">
              {stage.title.replace(/^\d{1,2}:\d{2}\s*/, '') || stage.title}
            </h2>
          </div>
          {(stage.description || marker?.description) && (
            <div className="mt-2">
              {(descOpen || !isMobile) ? (
                <p className="max-w-xl text-sm leading-relaxed text-white/70 md:text-base">
                  {stage.description || marker?.description}
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => setDescOpen(true)}
                  className="text-xs text-white/45"
                >
                  {stage.description || marker?.description} ▾
                </button>
              )}
            </div>
          )}
          <p className="mt-2 text-xs text-white/40">{countLabel}</p>
          {marker && (
            <p className="mt-1 text-[11px] text-white/35">影片 {marker.filmTime}</p>
          )}
        </div>

        <button
          type="button"
          onClick={() => onWatchVideo(stage.id)}
          className="photo-film-btn group flex shrink-0 items-center gap-2.5 self-start rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-sm text-white backdrop-blur-sm transition-all hover:border-white/40 hover:bg-white/10 md:self-auto"
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-full transition-transform group-hover:scale-110"
            style={{ background: `${accent}55` }}
            aria-hidden
          >
            ▶
          </span>
          <span>播放這段影片</span>
        </button>
      </div>
    </motion.header>
  );
};
