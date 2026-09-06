import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PhotoFilter, WeddingPhoto } from '../../types';
import {
  getBlurUrl,
  getDownloadUrl,
  getLightboxDisplayUrl,
  getLightboxZoomUrl,
  getThumbUrl,
} from '../../utils/photoUrls';
import { downloadSinglePhoto } from '../../utils/photoDownload';
import {
  isImagePreloaded,
  preloadImageUrl,
  preloadLightboxNeighbors,
} from '../../utils/photoPreload';
import { buildPhotoShareUrl, buildPhotoShareTitle } from '../../hooks/usePhotoDeepLink';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useLightboxZoom } from '../../hooks/useLightboxZoom';
import { getStageLabel } from '../../utils/photoStageMeta';
import { PHOTO_THEME } from '../../utils/photoTheme';
import {
  getPrioritizedPhotoMeta,
  photoNameMatchScore,
  photoTableMatchScore,
} from '../../utils/photoMetaDisplay';
import { formatTableTag, formatTableTagShort } from '../../utils/tableLabels';

const FILMSTRIP_WINDOW = 15;
/** 燈箱手機：約兩排 chip；桌機空間大可多顯示 */
const LIGHTBOX_MOBILE_NAME_CHIPS = 6;
const LIGHTBOX_MOBILE_TABLE_CHIPS = 4;
const LIGHTBOX_DESKTOP_NAME_CHIPS = 14;
const LIGHTBOX_DESKTOP_TABLE_CHIPS = 8;

interface PhotoLightboxProps {
  photo: WeddingPhoto;
  allPhotos: WeddingPhoto[];
  filter?: PhotoFilter;
  onClose: () => void;
  onChange: (photo: WeddingPhoto) => void;
  onNameClick?: (name: string) => void;
  onTagClick?: (tag: string) => void;
}

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({
  photo,
  allPhotos,
  filter,
  onClose,
  onChange,
  onNameClick,
  onTagClick,
}) => {
  const isMobile = useIsMobile();
  const [viewportWidth, setViewportWidth] = useState(
    () => (typeof window !== 'undefined' ? window.innerWidth : 1200)
  );
  const [devicePixelRatio, setDevicePixelRatio] = useState(
    () => (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1)
  );
  const [copied, setCopied] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [zoomLoaded, setZoomLoaded] = useState(false);
  const [zoomLoading, setZoomLoading] = useState(false);
  const [expandedMeta, setExpandedMeta] = useState<'names' | 'tables' | null>(null);
  const [downloadingOne, setDownloadingOne] = useState(false);
  const zoomRequestedRef = useRef(false);
  const filmstripRef = useRef<HTMLDivElement>(null);
  const currentIndex = allPhotos.findIndex((p) => p.id === photo.id);

  const { names: orderedNames, tables: orderedTables } = useMemo(
    () => getPrioritizedPhotoMeta(photo, filter),
    [photo, filter]
  );
  const nameChipLimit = isMobile ? LIGHTBOX_MOBILE_NAME_CHIPS : LIGHTBOX_DESKTOP_NAME_CHIPS;
  const tableChipLimit = isMobile ? LIGHTBOX_MOBILE_TABLE_CHIPS : LIGHTBOX_DESKTOP_TABLE_CHIPS;
  const visibleNames =
    expandedMeta === 'names' ? orderedNames : orderedNames.slice(0, nameChipLimit);
  const visibleTables =
    expandedMeta === 'tables' ? orderedTables : orderedTables.slice(0, tableChipLimit);
  const hiddenNameCount = Math.max(0, orderedNames.length - nameChipLimit);
  const hiddenTableCount = Math.max(0, orderedTables.length - tableChipLimit);

  useEffect(() => {
    setExpandedMeta(null);
  }, [photo.id, filter?.name, filter?.tag, filter?.table, filter?.query]);

  const {
    scale,
    offset,
    reset: resetZoom,
    containerRef,
    isZoomed,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  } = useLightboxZoom(isMobile);

  const displayUrl = useMemo(
    () => getLightboxDisplayUrl(photo.publicId, viewportWidth, devicePixelRatio),
    [photo.publicId, viewportWidth, devicePixelRatio]
  );
  const zoomUrl = useMemo(
    () => getLightboxZoomUrl(photo.publicId, viewportWidth, devicePixelRatio),
    [photo.publicId, viewportWidth, devicePixelRatio]
  );
  const isDisplayingZoom = isZoomed && zoomLoaded;
  const imageUrl = isDisplayingZoom ? zoomUrl : displayUrl;
  const isPreloaded = isImagePreloaded(imageUrl);

  const imageMaxH = isMobile ? 'max-h-[72dvh]' : 'max-h-[60dvh]';

  const goPrev = useCallback(() => {
    if (currentIndex > 0) onChange(allPhotos[currentIndex - 1]);
  }, [allPhotos, currentIndex, onChange]);

  const goNext = useCallback(() => {
    if (currentIndex < allPhotos.length - 1) onChange(allPhotos[currentIndex + 1]);
  }, [allPhotos, currentIndex, onChange]);

  useEffect(() => {
    const syncViewport = () => {
      setViewportWidth(window.innerWidth);
      setDevicePixelRatio(window.devicePixelRatio || 1);
    };
    syncViewport();
    window.addEventListener('resize', syncViewport);
    return () => window.removeEventListener('resize', syncViewport);
  }, []);

  useEffect(() => {
    resetZoom();
    setImageError(false);
    setZoomLoaded(false);
    setZoomLoading(false);
    zoomRequestedRef.current = false;

    if (isImagePreloaded(displayUrl)) {
      setImageLoaded(true);
      return;
    }

    setImageLoaded(false);
    let cancelled = false;
    preloadImageUrl(displayUrl)
      .then(() => {
        if (!cancelled) setImageLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setImageLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [photo.id, displayUrl, resetZoom]);

  useEffect(() => {
    if (!isZoomed || zoomLoaded || zoomRequestedRef.current) return;

    let cancelled = false;
    zoomRequestedRef.current = true;
    setZoomLoading(true);
    preloadImageUrl(zoomUrl)
      .then(() => {
        if (!cancelled) setZoomLoaded(true);
      })
      .catch(() => {
        // Keep displaying the initial image if the zoom asset cannot be loaded.
      })
      .finally(() => {
        if (!cancelled) setZoomLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isZoomed, zoomLoaded, zoomUrl]);

  useEffect(() => {
    preloadLightboxNeighbors(allPhotos, currentIndex, viewportWidth, undefined, devicePixelRatio);
  }, [allPhotos, currentIndex, viewportWidth, devicePixelRatio]);

  useEffect(() => {
    const el = filmstripRef.current?.querySelector(`[data-photo-id="${photo.id}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
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

  const onSwipe = useCallback(
    (result: { direction: 'left' | 'right' | 'down' | null }) => {
      if (result.direction === 'down') onClose();
      if (result.direction === 'right') goPrev();
      if (result.direction === 'left') goNext();
    },
    [onClose, goPrev, goNext]
  );

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

  const handleDownload = async () => {
    if (downloadingOne) return;
    setDownloadingOne(true);
    try {
      await downloadSinglePhoto(photo, 'print');
    } catch {
      const a = document.createElement('a');
      a.href = getDownloadUrl(photo.publicId, 'print');
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.click();
    } finally {
      setDownloadingOne(false);
    }
  };

  const windowStart = Math.max(0, currentIndex - FILMSTRIP_WINDOW);
  const windowEnd = Math.min(allPhotos.length, currentIndex + FILMSTRIP_WINDOW + 1);
  const filmstripPhotos = allPhotos.slice(windowStart, windowEnd);

  const blurUrl = getBlurUrl(photo.publicId);
  const stageLabel = getStageLabel(photo.stageId);
  const imageTransition = isPreloaded ? { duration: 0.12 } : { duration: 0.22 };

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
            {isZoomed && isMobile && (
              <button
                type="button"
                onClick={resetZoom}
                className="rounded-lg px-3 py-1.5 text-sm text-[var(--photo-gold-light)] hover:bg-white/10"
              >
                還原
              </button>
            )}
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloadingOne}
              className="rounded-lg px-3 py-1.5 text-sm hover:bg-white/10 disabled:opacity-60"
              aria-label={isMobile ? '儲存照片到相簿' : '下載照片'}
            >
              {downloadingOne ? (isMobile ? '準備中…' : '下載中…') : isMobile ? '儲存' : '下載'}
            </button>
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
        ref={containerRef}
        className="relative flex min-h-0 flex-1 touch-none items-center justify-center overflow-hidden px-1"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={(event) => handleTouchEnd(event, onSwipe)}
      >
        {currentIndex > 0 && !isZoomed && (
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

        <div
          className={`relative flex ${imageMaxH} max-w-full items-center justify-center photo-lightbox-vignette`}
          style={{
            transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
            transition: isZoomed ? undefined : 'transform 0.2s ease-out',
            willChange: isZoomed ? 'transform' : undefined,
          }}
        >
          {!imageLoaded && !imageError && (
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
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.img
              key={photo.id}
              src={imageUrl}
              alt={photo.caption || photo.names.join('、') || '婚禮照片'}
              initial={{ opacity: 0 }}
              animate={{ opacity: imageLoaded ? 1 : 0 }}
              exit={{ opacity: 0 }}
              transition={imageTransition}
              onLoad={() => setImageLoaded(true)}
              onError={() => {
                setImageError(true);
                setImageLoaded(false);
              }}
              decoding="async"
              fetchPriority="high"
              className={`${imageMaxH} max-w-full object-contain select-none`}
              draggable={false}
            />
          </AnimatePresence>
          {zoomLoading && !zoomLoaded && (
            <div
              className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-black/65 px-3 py-1 text-[10px] text-white/70 backdrop-blur-sm"
              role="status"
              aria-live="polite"
            >
              正在提升畫質…
            </div>
          )}
          {imageError && (
            <div className="absolute inset-x-4 bottom-4 rounded-xl border border-white/10 bg-black/70 px-4 py-3 text-center text-xs text-white/70">
              照片載入失敗，請稍後重試
            </div>
          )}
        </div>

        {currentIndex < allPhotos.length - 1 && !isZoomed && (
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
        {orderedNames.length > 0 && (
          <div
            className={`flex flex-wrap content-start gap-1.5 ${
              expandedMeta === 'names' ? '' : 'max-h-[3.75rem] overflow-hidden md:max-h-[4.5rem]'
            }`}
          >
            {visibleNames.map((name) => {
              const matched = photoNameMatchScore(name, filter) > 0;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => onNameClick?.(name)}
                  className={`rounded-full border px-2.5 py-0.5 text-xs ${
                    matched
                      ? 'border-[#B08D55]/70 bg-[#B08D55]/30 text-[#F5E6C8]'
                      : 'border-[#B08D55]/50 bg-[#B08D55]/20 text-[#F5E6C8]'
                  }`}
                >
                  {name}
                </button>
              );
            })}
            {hiddenNameCount > 0 && (
              <button
                type="button"
                onClick={() => setExpandedMeta(expandedMeta === 'names' ? null : 'names')}
                className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-white/55"
                aria-expanded={expandedMeta === 'names'}
              >
                {expandedMeta === 'names' ? '−' : `+${hiddenNameCount}`}
              </button>
            )}
          </div>
        )}

        {orderedTables.length > 0 && (
          <div
            className={`flex flex-wrap content-start gap-1.5 ${
              expandedMeta === 'tables' ? '' : 'max-h-[3.75rem] overflow-hidden md:max-h-[4.5rem]'
            }`}
          >
            {visibleTables.map((table) => {
              const matched = photoTableMatchScore(table, filter) > 0;
              return (
                <button
                  key={table}
                  type="button"
                  onClick={() => onTagClick?.(formatTableTag(table).replace(/^#/, ''))}
                  className={`rounded-full border px-2.5 py-0.5 text-xs ${
                    matched
                      ? 'border-white/25 bg-white/12 text-white/90'
                      : 'border-white/12 bg-white/5 text-white/72'
                  }`}
                  title={formatTableTag(table)}
                >
                  {expandedMeta === 'tables' || !isMobile
                    ? formatTableTag(table)
                    : formatTableTagShort(table)}
                </button>
              );
            })}
            {hiddenTableCount > 0 && (
              <button
                type="button"
                onClick={() => setExpandedMeta(expandedMeta === 'tables' ? null : 'tables')}
                className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs text-white/55"
                aria-expanded={expandedMeta === 'tables'}
              >
                {expandedMeta === 'tables' ? '−' : `+${hiddenTableCount}`}
              </button>
            )}
          </div>
        )}

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
                aria-label={`查看第 ${windowStart + filmstripPhotos.indexOf(p) + 1} 張照片`}
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

        {isMobile && (
          <p className="text-center text-[10px] text-white/25">
            {isZoomed ? '雙指縮放 · 拖移查看 · 雙擊或點還原' : '雙指或雙擊縮放 · 左右滑動換張 · 下滑關閉'}
          </p>
        )}
      </footer>
    </motion.div>
  );
};
