import React, { useCallback, useRef, useState } from 'react';
import { getStageFilmMarker } from '../../utils/weddingFilm';
import type { TimelineNavItem } from './PhotoTimelineNav';

interface PhotoChapterRailProps {
  items: TimelineNavItem[];
  activeStageId: string;
  onSelect: (stageId: string) => void;
  filmExpanded?: boolean;
}

const DRAG_THRESHOLD_PX = 10;

export const PhotoChapterRail: React.FC<PhotoChapterRailProps> = ({
  items,
  activeStageId,
  onSelect,
  filmExpanded = false,
}) => {
  const railRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const lastIndexRef = useRef<number | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const didDragRef = useRef(false);

  const activeIndex = items.findIndex((item) => item.id === activeStageId);
  const activeItem = items.find((item) => item.id === activeStageId) ?? items[0];
  const activeMarker = getStageFilmMarker(activeItem?.id ?? '');
  const previewItem =
    items.find((item) => item.id === (previewId ?? activeStageId)) ?? items[0];
  const previewMarker = getStageFilmMarker(previewItem?.id ?? '');

  const indexFromClientY = useCallback(
    (clientY: number) => {
      const rail = railRef.current;
      if (!rail || items.length === 0) return null;

      const markers = Array.from(
        rail.querySelectorAll<HTMLElement>('[data-chapter-index]')
      );
      if (markers.length === 0) return null;

      const closest = markers.reduce((best, marker) => {
        const bestCenter =
          best.getBoundingClientRect().top + best.getBoundingClientRect().height / 2;
        const markerCenter =
          marker.getBoundingClientRect().top + marker.getBoundingClientRect().height / 2;
        return Math.abs(markerCenter - clientY) < Math.abs(bestCenter - clientY)
          ? marker
          : best;
      }, markers[0]);

      const index = Number(closest.dataset.chapterIndex);
      return Number.isNaN(index) ? null : index;
    },
    [items.length]
  );

  const selectIndex = useCallback(
    (index: number) => {
      if (lastIndexRef.current === index) return;
      lastIndexRef.current = index;
      const item = items[index];
      if (!item) return;
      setPreviewId(item.id);
      onSelect(item.id);
    },
    [items, onSelect]
  );

  const selectAtClientY = useCallback(
    (clientY: number) => {
      const index = indexFromClientY(clientY);
      if (index == null) return;
      selectIndex(index);
    },
    [indexFromClientY, selectIndex]
  );

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    didDragRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    lastIndexRef.current = null;
    selectAtClientY(event.clientY);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || !pointerStartRef.current) return;

    const dx = event.clientX - pointerStartRef.current.x;
    const dy = event.clientY - pointerStartRef.current.y;
    if (Math.hypot(dx, dy) >= DRAG_THRESHOLD_PX) {
      didDragRef.current = true;
    }

    selectAtClientY(event.clientY);
  };

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragging(false);
    setPreviewId(null);
    lastIndexRef.current = null;
    pointerStartRef.current = null;
    didDragRef.current = false;
  };

  const handleDotClick = (event: React.MouseEvent, index: number) => {
    event.stopPropagation();
    if (didDragRef.current) return;
    selectIndex(index);
  };

  if (items.length <= 1) return null;

  return (
    <div
      className="pointer-events-none fixed right-0 z-30 flex w-8 items-center justify-end pr-0.5"
      style={{
        top: `calc(env(safe-area-inset-top) + ${
          filmExpanded ? 'min(28rem, 52dvh)' : '6rem'
        })`,
        bottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)',
      }}
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
        aria-label="章節時間軸，可點擊或長按拖曳快速跳轉"
        aria-valuemin={1}
        aria-valuemax={items.length}
        aria-valuenow={activeIndex + 1}
        aria-valuetext={`${previewItem?.time ?? ''} ${previewItem?.label ?? ''}`}
        className={`photo-chapter-rail pointer-events-auto flex touch-none flex-col items-center rounded-full border px-0.5 py-2 transition ${
          dragging
            ? 'border-[var(--photo-accent)]/40 bg-black/80 shadow-lg'
            : 'border-white/10 bg-black/55 backdrop-blur-sm'
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div className="flex flex-col items-center gap-0">
          {items.map((item, index) => {
            const isActive = item.id === activeStageId;
            const marker = getStageFilmMarker(item.id);
            const isPreview = dragging && item.id === previewId;

            return (
              <React.Fragment key={item.id}>
                <button
                  type="button"
                  data-chapter-index={index}
                  aria-label={`${item.time} ${item.label}`}
                  aria-current={isActive ? 'step' : undefined}
                  onClick={(event) => handleDotClick(event, index)}
                  className="group flex min-h-[20px] min-w-[20px] items-center justify-center rounded-full p-1 transition"
                >
                  <span
                    aria-hidden
                    className={`block rounded-full transition-all duration-200 ${
                      isActive || isPreview ? 'h-3 w-1.5' : 'h-1.5 w-1.5'
                    } ${!isActive && !isPreview ? 'group-hover:h-2 group-hover:w-2' : ''}`}
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
                </button>
              </React.Fragment>
            );
          })}
        </div>
        {activeItem && !dragging && (
          <span
            className="mt-1 max-w-8 text-center text-[9px] leading-tight tracking-[0.08em] text-white/75"
            style={{ color: activeMarker?.accent ?? '#e6c896' }}
            aria-hidden
          >
            {activeItem.label}
          </span>
        )}
      </div>
    </div>
  );
};
