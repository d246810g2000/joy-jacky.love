import React, { useCallback, useRef, useState } from 'react';
import { getStageFilmMarker } from '../../utils/weddingFilm';
import type { TimelineNavItem } from './PhotoTimelineNav';

interface PhotoChapterRailProps {
  items: TimelineNavItem[];
  activeStageId: string;
  onSelect: (stageId: string) => void;
}

export const PhotoChapterRail: React.FC<PhotoChapterRailProps> = ({
  items,
  activeStageId,
  onSelect,
}) => {
  const railRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const lastIndexRef = useRef<number | null>(null);

  const activeIndex = items.findIndex((item) => item.id === activeStageId);
  const activeItem = items.find((item) => item.id === activeStageId) ?? items[0];
  const activeMarker = getStageFilmMarker(activeItem?.id ?? '');
  const previewItem =
    items.find((item) => item.id === (previewId ?? activeStageId)) ?? items[0];
  const previewMarker = getStageFilmMarker(previewItem?.id ?? '');

  const selectAtClientY = useCallback(
    (clientY: number) => {
      const rail = railRef.current;
      if (!rail || items.length === 0) return;

      const markers = Array.from(
        rail.querySelectorAll<HTMLElement>('[data-chapter-index]')
      );
      if (markers.length === 0) return;

      const index = Number(
        markers.reduce((closest, marker) => {
          const closestDistance = Math.abs(
            closest.getBoundingClientRect().top +
              closest.getBoundingClientRect().height / 2 -
              clientY
          );
          const markerDistance = Math.abs(
            marker.getBoundingClientRect().top +
              marker.getBoundingClientRect().height / 2 -
              clientY
          );
          return markerDistance < closestDistance ? marker : closest;
        }, markers[0]).dataset.chapterIndex
      );
      if (Number.isNaN(index)) return;
      if (lastIndexRef.current === index) return;

      lastIndexRef.current = index;
      const item = items[index];
      if (!item) return;

      setPreviewId(item.id);
      onSelect(item.id);
    },
    [items, onSelect]
  );

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    lastIndexRef.current = null;
    selectAtClientY(event.clientY);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    selectAtClientY(event.clientY);
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragging(false);
    setPreviewId(null);
    lastIndexRef.current = null;
  };

  if (items.length <= 1) return null;

  return (
    <div
      className="pointer-events-none fixed inset-y-0 right-0 z-30 flex w-12 items-center justify-end pr-1 photo-safe-top photo-safe-bottom"
    >
      {dragging && previewItem && (
        <div
          className="pointer-events-none absolute right-11 top-1/2 max-w-[42vw] -translate-y-1/2 rounded-xl border border-white/15 bg-[#141210]/95 px-3 py-2 shadow-xl backdrop-blur-md"
          role="status"
          aria-live="polite"
        >
          <p className="font-mono text-[10px] tabular-nums text-white/45">章節</p>
          <p className="truncate text-xs font-medium text-white">
            <span style={{ color: previewMarker?.accent ?? '#e6c896' }}>{previewItem.time}</span>
            <span className="ml-1.5 text-white/85">{previewItem.label}</span>
          </p>
        </div>
      )}

      <div
        ref={railRef}
        role="slider"
        aria-label="章節時間軸，可長按拖曳快速跳轉"
        aria-valuemin={1}
        aria-valuemax={items.length}
        aria-valuenow={activeIndex + 1}
        aria-valuetext={`${previewItem?.time ?? ''} ${previewItem?.label ?? ''}`}
        className={`photo-chapter-rail pointer-events-auto flex touch-none flex-col items-center gap-1.5 rounded-full border px-1.5 py-2.5 transition ${
          dragging
            ? 'border-[var(--photo-accent)]/40 bg-black/80 shadow-lg'
            : 'border-white/10 bg-black/55 backdrop-blur-sm'
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {items.map((item) => {
          const isActive = item.id === activeStageId;
          const marker = getStageFilmMarker(item.id);
          const isPreview = dragging && item.id === previewId;

          return (
            <React.Fragment key={item.id}>
              <span
                aria-hidden
                data-chapter-index={items.indexOf(item)}
                className={`rounded-full transition-all duration-200 ${
                  isActive || isPreview ? 'h-3 w-1.5' : 'h-1.5 w-1.5'
                }`}
                style={{
                  backgroundColor:
                    isActive || isPreview
                      ? marker?.accent ?? '#e6c896'
                      : 'rgba(255,255,255,0.28)',
                  boxShadow:
                    isActive || isPreview
                      ? `0 0 10px ${marker?.accent ?? '#e6c896'}88`
                      : undefined,
                  opacity: dragging && !isActive && !isPreview ? 0.65 : 1,
                }}
              />
              {isActive && !dragging && (
                <span
                  className="max-h-24 max-w-4 truncate text-[9px] leading-tight tracking-[0.1em] [writing-mode:vertical-rl]"
                  style={{ color: activeMarker?.accent ?? '#e6c896' }}
                  aria-hidden
                >
                  {activeItem.label}
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
