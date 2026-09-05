import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { WeddingStage } from '../../types';
import { getStageFilmMarker } from '../../utils/weddingFilm';
import { useIsMobile } from '../../hooks/useIsMobile';
import { chapterLabel } from '../../utils/photoTheme';

interface PhotoStageHeaderProps {
  stage: WeddingStage;
  photoCount: number;
  visibleCount?: number;
  index: number;
  onWatchVideo: (stageId: string) => void;
  compact?: boolean;
}

export const PhotoStageHeader: React.FC<PhotoStageHeaderProps> = ({
  stage,
  photoCount,
  visibleCount,
  index,
  onWatchVideo,
  compact = false,
}) => {
  const isMobile = useIsMobile();
  const [descOpen, setDescOpen] = useState(!isMobile && !compact);
  const marker = getStageFilmMarker(stage.id);
  const accent = marker?.accent ?? 'var(--photo-accent)';
  const stageLabel = stage.title.replace(/^\d{1,2}:\d{2}\s*/, '') || stage.title;
  const countLabel =
    visibleCount != null && visibleCount < photoCount
      ? `已顯示 ${visibleCount} / 共 ${photoCount} 張`
      : `${photoCount} 張照片`;

  return (
    <motion.header
      initial={{ opacity: 0, y: compact ? 12 : 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10%' }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={`photo-stage-header relative overflow-hidden rounded-2xl border border-white/10 ${
        compact ? 'mb-4 py-4 pl-5 pr-4' : 'mb-6 px-5 py-6 md:px-8 md:py-8'
      }`}
      style={{
        background: compact
          ? `radial-gradient(ellipse 80% 120% at 0% 50%, ${accent}22 0%, transparent 55%), linear-gradient(135deg, rgba(20,18,16,0.92) 0%, rgba(12,11,10,0.96) 100%)`
          : `linear-gradient(135deg, color-mix(in srgb, ${accent} 12%, transparent) 0%, rgba(20,18,16,0.85) 55%, rgba(12,11,10,0.92) 100%)`,
        boxShadow: `0 0 48px color-mix(in srgb, ${accent} 12%, transparent)`,
      }}
    >
      {compact && (
        <div
          className="absolute left-0 top-3 bottom-3 w-0.5 rounded-full"
          style={{ background: `linear-gradient(180deg, ${accent}, transparent)` }}
          aria-hidden
        />
      )}

      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-25 blur-3xl"
        style={{ background: accent }}
        aria-hidden
      />

      <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <p className="text-xs tracking-wide text-white/45">
            {compact ? chapterLabel(index, stageLabel) : `CHAPTER ${String(index + 1).padStart(2, '0')}`}
          </p>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span
              className="font-mono text-xl font-light tabular-nums md:text-3xl"
              style={{ color: accent }}
            >
              {stage.time}
            </span>
            <h2 className="font-serif text-xl text-white md:text-3xl">{stageLabel}</h2>
          </div>
          {(stage.description || marker?.description) && (
            <div className="mt-2">
              {descOpen || !isMobile ? (
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
        </div>

        {!compact && (
          <button
            type="button"
            onClick={() => onWatchVideo(stage.id)}
            className="photo-film-btn group flex shrink-0 items-center gap-2.5 self-start rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-sm text-white backdrop-blur-sm transition-all hover:border-white/40 hover:bg-white/10 md:self-auto"
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full transition-transform group-hover:scale-110"
              style={{ background: `color-mix(in srgb, ${accent} 55%, transparent)` }}
              aria-hidden
            >
              ▶
            </span>
            <span>播放這段影片</span>
          </button>
        )}
      </div>
    </motion.header>
  );
};
