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
          className="fixed inset-0 z-[60] flex flex-col bg-black photo-safe-top photo-safe-bottom"
          role="dialog"
          aria-modal="true"
          aria-label="婚宴影片"
        >
          <header className="flex shrink-0 items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate font-serif text-base text-white">{title}</p>
              {subtitle && <p className="truncate text-xs text-white/60">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg p-2 text-white hover:bg-white/10"
              aria-label="關閉影片"
            >
              ✕
            </button>
          </header>

          <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-4 pb-6">
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
              <>
                <div className="photo-film-vignette relative w-full max-w-5xl overflow-hidden rounded-2xl shadow-2xl shadow-black/60">
                  <div className="relative aspect-video w-full bg-black">
                    <iframe
                      key={startSec}
                      src={getFilmEmbedUrl(startSec)}
                      title={title}
                      className="absolute inset-0 h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
                <a
                  href={watchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 text-sm text-white/50 underline-offset-2 hover:underline"
                >
                  在 YouTube 開啟 ↗
                </a>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
