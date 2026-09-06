import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getFilmEmbedUrl, getFilmWatchUrl } from '../../utils/weddingFilm';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useModalHistory } from '../../hooks/useModalHistory';
import { useIsMobile } from '../../hooks/useIsMobile';

interface PhotoVideoPlayerProps {
  open: boolean;
  startSec: number;
  title: string;
  subtitle?: string;
  onClose: () => void;
}

export const PhotoVideoPlayer: React.FC<PhotoVideoPlayerProps> = ({
  open,
  startSec,
  title,
  subtitle,
  onClose,
}) => {
  const isMobile = useIsMobile();
  const [embedActive, setEmbedActive] = useState(false);

  useBodyScrollLock(open);
  useModalHistory(open, onClose);

  useEffect(() => {
    if (!open) setEmbedActive(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const watchUrl = getFilmWatchUrl(startSec);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="photo-video-theater fixed inset-0 z-[70] flex flex-col bg-black photo-safe-top photo-safe-bottom"
          role="dialog"
          aria-modal="true"
          aria-label="婚宴影片"
        >
          <header className="relative z-10 flex shrink-0 items-center justify-between gap-3 px-4 py-3 md:px-6">
            <div className="min-w-0">
              <p className="truncate font-serif text-base text-white md:text-lg">{title}</p>
              {subtitle && (
                <p className="truncate text-xs text-white/55 md:text-sm">{subtitle}</p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <a
                href={watchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/70 transition hover:bg-white/10 sm:inline"
              >
                YouTube ↗
              </a>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/15 px-3 py-1.5 text-xs text-white/85 transition hover:bg-white/10"
                aria-label="關閉影片"
              >
                關閉 ✕
              </button>
            </div>
          </header>

          <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-3 pb-4 md:px-8 md:pb-8">
            {isMobile && !embedActive ? (
              <div className="flex w-full max-w-md flex-col items-center gap-6 py-8 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#B08D55]/20 text-3xl">
                  ▶
                </div>
                <p className="text-sm text-white/60">
                  建議在 YouTube App 觀看，體驗最佳
                  <br />
                  <span className="text-white/40">可開啟聲音、旋轉橫屏</span>
                </p>
                <a
                  href={watchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full rounded-full bg-[#B08D55] py-3.5 text-center text-sm font-medium text-white shadow-lg"
                >
                  在 YouTube 觀看
                </a>
                <button
                  type="button"
                  onClick={() => setEmbedActive(true)}
                  className="text-sm text-white/45 underline-offset-2 hover:underline"
                >
                  在此頁面播放
                </button>
              </div>
            ) : (
              <div className="photo-video-theater__frame relative w-full overflow-hidden rounded-xl bg-black shadow-2xl shadow-black/80 md:rounded-2xl">
                <iframe
                  key={startSec}
                  src={getFilmEmbedUrl(startSec)}
                  title={title}
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
