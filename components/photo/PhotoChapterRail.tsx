import React, { useCallback, useEffect, useRef, useState } from 'react';
import { getStageFilmMarker } from '../../utils/weddingFilm';
import type { TimelineNavItem } from './PhotoTimelineNav';

interface PhotoChapterRailProps {
  items: TimelineNavItem[];
  activeStageId: string;
  onSelect: (stageId: string) => void;
}

function indexFromClientY(
  clientY: number,
  rect: DOMRect,
  count: number
): number {
  if (count <= 1) return 0;
  const ratio = (clientY - rect.top) / rect.height;
  return Math.min(count - 1, Math.max(0, Math.round(ratio * (count - 1))));
}

export const PhotoChapterRail: React.FC<PhotoChapterRailProps> = ({
  items,
  activeStageId,
  onSelect,
}) => {
  const railRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);
  const [dragging, setDragging] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const lastIndexRef = useRef<number | null>(null);

  const previewItem =
    items.find((item) => item.id === (previewId ?? activeStageId)) ?? items[0];
  const previewMarker = getStageFilmMarker(previewItem?.id ?? '');

  useEffect(() => {
    activeItemRef.current?.scrollIntoView({ block: 'nearest' });
  }, [activeStageId]);

  const selectAtClientY = useCallback(
    (clientY: number) => {
      const rail = railRef.current;
      if (!rail || items.length === 0) return;

      const index = indexFromClientY(clientY, rail.getBoundingClientRect(), items.length);
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
      className="pointer-events-none fixed inset-y-0 right-0 z-30 flex w-[min(18vw,68px)] items-center justify-end pr-1 photo-safe-top photo-safe-bottom"
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
        role="group"
        aria-label="章節時間軸，可點擊或拖曳快速跳轉"
        className={`photo-chapter-rail no-scrollbar pointer-events-auto flex max-h-[min(68dvh,560px)] w-full touch-none flex-col gap-1 overflow-y-auto rounded-2xl border p-1 transition ${
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
            <button
              key={item.id}
              ref={isActive ? activeItemRef : undefined}
              type="button"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => {
                setPreviewId(null);
                onSelect(item.id);
              }}
              aria-label={`跳轉到 ${item.time} ${item.label}`}
              aria-current={isActive ? 'step' : undefined}
              className={`flex min-h-14 w-full shrink-0 items-center justify-center rounded-xl px-1 py-1 text-left transition ${
                isActive || isPreview
                  ? 'bg-white/12 text-white'
                  : 'text-white/50 active:bg-white/8'
              }`}
              style={{
                borderLeft: `2px solid ${
                  isActive || isPreview
                    ? marker?.accent ?? '#e6c896'
                    : 'transparent'
                }`,
                opacity: dragging && !isActive && !isPreview ? 0.65 : 1,
              }}
            >
              <span
                className="truncate text-[11px] leading-tight tracking-[0.12em] [writing-mode:vertical-rl]"
                style={{
                  color:
                    isActive || isPreview
                      ? marker?.accent ?? '#e6c896'
                      : undefined,
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
