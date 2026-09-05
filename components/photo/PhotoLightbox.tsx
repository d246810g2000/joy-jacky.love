import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PhotoFilter, WeddingPhoto } from '../../types';
import {
  getBlurUrl,
  getLightboxUrl,
  getOriginalUrl,
  getThumbUrl,
  prefetchPhoto,
} from '../../utils/photoUrls';
import { buildPhotoShareUrl, buildPhotoShareTitle } from '../../hooks/usePhotoDeepLink';
import { useIsMobile } from '../../hooks/useIsMobile';
import { getStageFilmMarker } from '../../utils/weddingFilm';
import { PHOTO_THEME } from '../../utils/photoTheme';

const FILMSTRIP_WINDOW = 15;

interface PhotoLightboxProps {
  photo: WeddingPhoto;
  allPhotos: WeddingPhoto[];
  filter?: PhotoFilter;
  onClose: () => void;
  onChange: (photo: WeddingPhoto) => void;
  onTagClick?: (tag: string) => void;
  onNameClick?: (name: string) => void;
  onWatchFilm?: (stageId: string) => void;
}

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({
  photo,
  allPhotos,
  filter,
  onClose,
  onChange,
  onTagClick,
  onNameClick,
  onWatchFilm,
}) => {
  const isMobile = useIsMobile();
  const [copied, setCopied] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showFilmstrip, setShowFilmstrip] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const filmstripRef = useRef<HTMLDivElement>(null);
  const currentIndex = allPhotos.findIndex((p) => p.id === photo.id);

  const imageMaxH = isMobile ? 'max-h-[72dvh]' : 'max-h-[60dvh]';

  const goPrev = useCallback(() => {
    if (currentIndex > 0) onChange(allPhotos[currentIndex - 1]);
  }, [allPhotos, currentIndex, onChange]);

  const goNext = useCallback(() => {
    if (currentIndex < allPhotos.length - 1) onChange(allPhotos[currentIndex + 1]);
  }, [allPhotos, currentIndex, onChange]);

  useEffect(() => {
    setImageLoaded(false);
  }, [photo.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, goPrev, goNext]);

  useEffect(() => {
    const prev = allPhotos[currentIndex - 1];
    const next = allPhotos[currentIndex + 1];
    [prev, next].forEach((p) => {
      if (p) prefetchPhoto(p.publicId);
    });
  }, [currentIndex, allPhotos]);

  useEffect(() => {
    if (!showFilmstrip) return;
    const el = filmstripRef.current?.querySelector(`[data-photo-id="${photo.id}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [photo.id, showFilmstrip]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = {
      x: e.touches[0]?.clientX ?? 0,
      y: e.touches[0]?.clientY ?? 0,
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStart.current.x;
    const dy = (e.changedTouches[0]?.clientY ?? 0) - touchStart.current.y;
    touchStart.current = null;

    if (dy > 70 && dy > Math.abs(dx) * 1.2) {
      onClose();
      return;
    }
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) goPrev();
      else goNext();
    }
  };

  const handleShare = async () => {
    const url = buildPhotoShareUrl(photo.id, filter);
    const title = buildPhotoShareTitle(filter, photo.names);
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* fall through */
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = getOriginalUrl(photo.publicId);
    a.download = `${photo.id}.jpg`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.click();
  };

  const tableTags = photo.tables.map((t) => `#第${t}桌`);
  const allTags = [...tableTags, ...photo.tags.map((t) => `#${t}`)];

  const windowStart = Math.max(0, currentIndex - FILMSTRIP_WINDOW);
  const windowEnd = Math.min(allPhotos.length, currentIndex + FILMSTRIP_WINDOW + 1);
  const filmstripPhotos = allPhotos.slice(windowStart, windowEnd);

  const blurUrl = getBlurUrl(photo.publicId);
  const lightboxUrl = getLightboxUrl(photo.publicId);
  const stageMarker = getStageFilmMarker(photo.stageId);
  const stageLabel = stageMarker?.label ?? '';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-black text-white photo-safe-bottom"
      role="dialog"
      aria-modal="true"
      aria-label="照片燈箱"
    >
      {isMobile && (
        <div className="flex shrink-0 flex-col items-center pt-[max(0.5rem,env(safe-area-inset-top))]">
          <div className="photo-lightbox-drag-hint h-1 w-10 rounded-full" aria-hidden />
        </div>
      )}

      <header className="flex shrink-0 flex-col gap-1 px-4 py-2 md:py-3 md:pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/80">
            {currentIndex + 1} / {allPhotos.length}
          </span>
          <div className="flex items-center gap-1 md:gap-2">
            {!isMobile && (
              <button
                type="button"
                onClick={handleDownload}
                className="rounded-lg px-3 py-1.5 text-sm hover:bg-white/10"
              >
                下載
              </button>
            )}
            <button
              type="button"
              onClick={handleShare}
              className="rounded-lg px-3 py-1.5 text-sm hover:bg-white/10"
            >
              {copied ? '已複製' : '分享'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 hover:bg-white/10"
              aria-label="關閉"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-white/55">
          {stageLabel && (
            <span className="text-[var(--photo-gold-light)]">{stageLabel}</span>
          )}
          <span className="font-mono tabular-nums">{photo.time}</span>
          <span className="text-white/30">·</span>
          <span className="italic text-white/45">{PHOTO_THEME.lightboxMotto}</span>
        </div>
      </header>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-1"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {currentIndex > 0 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-2 z-10 hidden rounded-full bg-black/40 p-3 hover:bg-black/60 md:block"
              aria-label="上一張"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-0 top-0 z-10 h-full w-[18%] md:hidden"
              aria-label="上一張"
            />
          </>
        )}

        <div className={`relative flex ${imageMaxH} max-w-full items-center justify-center photo-lightbox-vignette`}>
          {!imageLoaded && (
            <>
              <img
                src={blurUrl}
                alt=""
                className={`absolute ${imageMaxH} max-w-full object-contain opacity-60 blur-sm`}
                aria-hidden
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              </div>
            </>
          )}
          <AnimatePresence mode="wait">
            <motion.img
              key={photo.id}
              src={lightboxUrl}
              alt={photo.caption || photo.names.join('、') || '婚禮照片'}
              initial={{ opacity: 0 }}
              animate={{ opacity: imageLoaded ? 1 : 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onLoad={() => setImageLoaded(true)}
              className={`${imageMaxH} max-w-full object-contain`}
              draggable={false}
            />
          </AnimatePresence>
        </div>

        {currentIndex < allPhotos.length - 1 && (
          <>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-2 z-10 hidden rounded-full bg-black/40 p-3 hover:bg-black/60 md:block"
              aria-label="下一張"
            >
              ›
            </button>
            <button
              type="button"
              onClick={goNext}
              className="absolute right-0 top-0 z-10 h-full w-[18%] md:hidden"
              aria-label="下一張"
            />
          </>
        )}
      </div>

      <footer className="shrink-0 space-y-2 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white/10 px-3 py-1 font-mono text-xs tabular-nums md:text-sm">
            {photo.time}
          </span>
          {onWatchFilm && (
            <button
              type="button"
              onClick={() => onWatchFilm(photo.stageId)}
              className="flex items-center gap-1 rounded-full border border-[#B08D55]/40 bg-[#B08D55]/15 px-3 py-1 text-xs text-[#F5E6C8]"
            >
              <span aria-hidden>▶</span>
              影片中觀看
            </button>
          )}
          {isMobile && (
            <button
              type="button"
              onClick={handleDownload}
              className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70"
            >
              下載
            </button>
          )}
        </div>

        {photo.names.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {(showDetails ? photo.names : photo.names.slice(0, 4)).map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => onNameClick?.(name)}
                className="rounded-full border border-[#B08D55]/50 bg-[#B08D55]/20 px-2.5 py-0.5 text-xs text-[#F5E6C8]"
              >
                {name}
              </button>
            ))}
            {!showDetails && photo.names.length > 4 && (
              <button
                type="button"
                onClick={() => setShowDetails(true)}
                className="text-xs text-white/40"
              >
                +{photo.names.length - 4}
              </button>
            )}
          </div>
        )}

        {showDetails && (
          <>
            {photo.caption && <p className="text-sm text-white/85">{photo.caption}</p>}
            <div className="flex flex-wrap gap-1.5">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onTagClick?.(tag.replace(/^#/, ''))}
                  className="rounded-full border border-white/20 bg-white/5 px-2.5 py-0.5 text-xs"
                >
                  {tag}
                </button>
              ))}
            </div>
          </>
        )}

        {!showDetails && (photo.caption || allTags.length > 0) && isMobile && (
          <button
            type="button"
            onClick={() => setShowDetails(true)}
            className="text-xs text-white/40"
          >
            更多資訊 ▾
          </button>
        )}

        {isMobile ? (
          <button
            type="button"
            onClick={() => setShowFilmstrip((v) => !v)}
            className="text-xs text-white/45"
          >
            {showFilmstrip ? '隱藏縮圖' : `查看縮圖 (${allPhotos.length})`}
          </button>
        ) : null}

        {(showFilmstrip || !isMobile) && (
          <div ref={filmstripRef} className="no-scrollbar flex gap-2 overflow-x-auto py-1">
            {windowStart > 0 && (
              <span className="flex h-12 w-5 shrink-0 items-center justify-center text-xs text-white/40">
                …
              </span>
            )}
            {filmstripPhotos.map((p) => (
              <button
                key={p.id}
                type="button"
                data-photo-id={p.id}
                onClick={() => onChange(p)}
                className={`h-12 w-12 shrink-0 overflow-hidden rounded-lg border-2 md:h-14 md:w-14 ${
                  p.id === photo.id ? 'border-[#B08D55]' : 'border-transparent opacity-60'
                }`}
              >
                <img
                  src={getThumbUrl(p.publicId)}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
            {windowEnd < allPhotos.length && (
              <span className="flex h-12 w-5 shrink-0 items-center justify-center text-xs text-white/40">
                …
              </span>
            )}
          </div>
        )}

        {isMobile && (
          <p className="text-center text-[10px] text-white/25">下滑關閉</p>
        )}
      </footer>
    </motion.div>
  );
};
