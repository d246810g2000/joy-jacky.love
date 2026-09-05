import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getFilmEmbedUrl, getFilmWatchUrl } from '../../utils/weddingFilm';
import { PHOTO_THEME } from '../../utils/photoTheme';

interface PhotoInlineFilmProps {
  startSec: number;
  title: string;
  filmTime: string;
  clockTime?: string;
  accent?: string;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
}

export const PhotoInlineFilm: React.FC<PhotoInlineFilmProps> = ({
  startSec,
  title,
  filmTime,
  clockTime,
  accent = PHOTO_THEME.gold,
  expanded,
  onExpandedChange,
}) => {
  const [playing, setPlaying] = useState(false);
  const watchUrl = getFilmWatchUrl(startSec);

  const handleCollapse = () => {
    onExpandedChange(false);
    setPlaying(false);
  };

  const handleExpand = () => {
    onExpandedChange(true);
  };

  return (
    <div className="photo-inline-film border-b border-white/8">
      {!expanded ? (
        <button
          type="button"
          onClick={handleExpand}
          className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition active:bg-white/5"
          aria-expanded={false}
        >
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs text-white"
            style={{ background: `${accent}99`, boxShadow: `0 0 20px ${accent}44` }}
            aria-hidden
          >
            ▶
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-white">
              {clockTime && (
                <span className="font-mono text-[var(--photo-gold-light)]">{clockTime}</span>
              )}
              {clockTime && <span className="mx-1.5 text-white/30">·</span>}
              <span>{title}</span>
            </p>
            <p className="mt-0.5 text-[10px] text-white/40">影片 {filmTime}</p>
          </div>
          <span className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-[var(--photo-gold-light)]">
            展開
          </span>
        </button>
      ) : (
        <AnimatePresence initial={false}>
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative aspect-video w-full overflow-hidden bg-black">
              {playing ? (
                <iframe
                  key={startSec}
                  src={getFilmEmbedUrl(startSec)}
                  title={title}
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setPlaying(true)}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-2"
                  style={{
                    background: `linear-gradient(160deg, ${accent}33 0%, rgba(0,0,0,0.88) 55%)`,
                  }}
                  aria-label={`播放 ${title}`}
                >
                  <span
                    className="flex h-12 w-12 items-center justify-center rounded-full text-lg text-white shadow-lg"
                    style={{ background: `${accent}cc`, boxShadow: `0 0 28px ${accent}55` }}
                  >
                    ▶
                  </span>
                  <span className="px-4 text-center text-sm font-medium text-white">{title}</span>
                  <span className="text-xs text-white/50">影片 {filmTime}</span>
                </button>
              )}
            </div>
            <div className="flex items-center justify-between gap-2 bg-black/40 px-3 py-1.5">
              <p className="min-w-0 truncate text-[11px] text-white/55">
                {title} · 影片 {filmTime}
              </p>
              <div className="flex shrink-0 items-center gap-2">
                <a
                  href={watchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-[var(--photo-gold-light)]"
                >
                  YouTube ↗
                </a>
                <button
                  type="button"
                  onClick={handleCollapse}
                  className="text-[11px] text-white/40"
                  aria-label="收合影片"
                >
                  收合 ▴
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};
