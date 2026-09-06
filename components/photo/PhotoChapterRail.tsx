import React, { useCallback, useRef, useState } from 'react';
import { getStageAccent, getStageNavTime } from '../../utils/photoStageMeta';
import type { TimelineNavItem } from './PhotoTimelineNav';

interface PhotoChapterRailProps {
  items: TimelineNavItem[];
  activeStageId: string;
  onSelect: (stageId: string) => void;
  filmExpanded?: boolean;
  variant?: 'mobile' | 'desktop';
}

const DRAG_THRESHOLD_PX = 10;

function railTopOffset(variant: 'mobile' | 'desktop', filmExpanded: boolean): string {
  if (variant === 'desktop') {
    return filmExpanded
      ? 'calc(env(safe-area-inset-top, 0px) + min(28rem, 42vh) + 3.5rem)'
      : 'calc(env(safe-area-inset-top, 0px) + 9.5rem)';
  }
  return filmExpanded ? 'min(28rem, 52dvh)' : '6rem';
}

function railBottomOffset(variant: 'mobile' | 'desktop'): string {
  return variant === 'desktop'
    ? 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)'
    : 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)';
}

export const PhotoChapterRail: React.FC<PhotoChapterRailProps> = ({
  items,
  activeStageId,
  onSelect,
  filmExpanded = false,
  variant = 'mobile',
}) => {
  const railRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const lastIndexRef = useRef<number | null>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const didDragRef = useRef(false);

  const activeIndex = items.findIndex((item) => item.id === activeStageId);
  const activeItem = items[activeIndex] ?? items[0];
  const previewItem =
    items.find((item) => item.id === (previewId ?? activeStageId)) ?? items[0];
  const previewAccent = getStageAccent(previewItem?.id ?? '');
  const previewTime = previewItem
    ? getStageNavTime(previewItem.id, previewItem.time)
    : '';
  const activeAccent = getStageAccent(activeItem?.id ?? activeStageId);

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

  const isDesktop = variant === 'desktop';

  return (
    <div
      className={`pointer-events-none fixed right-0 z-30 flex items-center justify-end ${
        isDesktop ? 'w-10 pr-1' : 'w-8 pr-0.5'
      }`}
      style={{
        top: `calc(env(safe-area-inset-top, 0px) + ${railTopOffset(variant, filmExpanded)})`,
        bottom: railBottomOffset(variant),
      }}
    >
      {dragging && previewItem && (
        <div
          className={`pointer-events-none absolute top-1/2 -translate-y-1/2 rounded-xl border border-white/15 bg-[#141210]/95 px-3 py-2 shadow-xl backdrop-blur-md ${
            isDesktop ? 'right-12 max-w-[280px]' : 'right-11 max-w-[42vw]'
          }`}
          role="status"
          aria-live="polite"
        >
          <p className="font-mono text-[10px] tabular-nums text-white/45">章節</p>
          <p className="truncate text-xs font-medium text-white">
            {previewTime && (
              <span style={{ color: previewAccent }}>{previewTime}</span>
            )}
            <span className={previewTime ? 'ml-1.5 text-white/85' : 'text-white/85'}>
              {previewItem.label}
            </span>
          </p>
        </div>
      )}

      <div
        ref={railRef}
        role="slider"
        aria-label="章節時間軸，可點擊或拖曳快速跳轉"
        aria-valuemin={1}
        aria-valuemax={items.length}
        aria-valuenow={activeIndex + 1}
        aria-valuetext={`${previewTime} ${previewItem?.label ?? ''}`.trim()}
        className={`photo-chapter-rail pointer-events-auto flex touch-none flex-col items-center rounded-full border px-0.5 py-2 transition ${
          dragging
            ? 'border-[var(--photo-accent)]/40 bg-black/80 shadow-lg'
            : 'border-white/10 bg-black/55 backdrop-blur-sm'
        } ${isDesktop ? 'photo-chapter-rail--desktop' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div className="flex flex-col items-center gap-0">
          {items.map((item, index) => {
            const isActive = item.id === activeStageId;
            const accent = getStageAccent(item.id);
            const time = getStageNavTime(item.id, item.time);
            const isPreview = dragging && item.id === previewId;

            return (
              <button
                key={item.id}
                type="button"
                data-chapter-index={index}
                aria-label={`${time} ${item.label}`.trim()}
                aria-current={isActive ? 'step' : undefined}
                onClick={(event) => handleDotClick(event, index)}
                className={`group flex items-center justify-center rounded-full p-1 transition ${
                  isDesktop ? 'min-h-[22px] min-w-[22px]' : 'min-h-[20px] min-w-[20px]'
                }`}
              >
                <span
                  aria-hidden
                  className={`block rounded-full transition-all duration-200 ${
                    isActive || isPreview ? 'h-3 w-1.5' : 'h-1.5 w-1.5'
                  } ${!isActive && !isPreview ? 'group-hover:h-2 group-hover:w-2' : ''}`}
                  style={{
                    backgroundColor:
                      isActive || isPreview ? accent : 'rgba(255,255,255,0.28)',
                    boxShadow:
                      isActive || isPreview ? `0 0 10px ${accent}88` : undefined,
                    opacity: dragging && !isActive && !isPreview ? 0.65 : 1,
                  }}
                />
              </button>
            );
          })}
        </div>
        {activeItem && !dragging && (
          <span
            className={`mt-1 text-center leading-tight tracking-[0.08em] text-white/75 ${
              isDesktop ? 'max-w-9 text-[10px]' : 'max-w-8 text-[9px]'
            }`}
            style={{ color: activeAccent }}
            aria-hidden
          >
            {activeItem.label}
          </span>
        )}
      </div>
    </div>
  );
};
