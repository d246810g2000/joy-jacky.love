import { useCallback, useRef, useState } from 'react';

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_MS = 280;
const DOUBLE_TAP_SCALE = 2.5;

function distance(a: Touch, b: Touch): number {
  const dx = a.clientX - b.clientX;
  const dy = a.clientY - b.clientY;
  return Math.hypot(dx, dy);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

interface SwipeResult {
  direction: 'left' | 'right' | 'down' | null;
}

export function useLightboxZoom(enabled: boolean) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const gestureRef = useRef({
    mode: 'idle' as 'idle' | 'pinch' | 'pan' | 'swipe',
    startScale: 1,
    startDistance: 0,
    startOffset: { x: 0, y: 0 },
    startTouch: { x: 0, y: 0 },
    lastTapAt: 0,
  });

  const clampOffset = useCallback(
    (next: { x: number; y: number }, nextScale: number) => {
      const el = containerRef.current;
      if (!el || nextScale <= 1) return { x: 0, y: 0 };

      const { width, height } = el.getBoundingClientRect();
      const maxX = Math.max(0, (width * (nextScale - 1)) / 2);
      const maxY = Math.max(0, (height * (nextScale - 1)) / 2);
      return {
        x: clamp(next.x, -maxX, maxX),
        y: clamp(next.y, -maxY, maxY),
      };
    },
    []
  );

  const reset = useCallback(() => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
    gestureRef.current.mode = 'idle';
  }, []);

  const handleTouchStart = useCallback(
    (event: React.TouchEvent) => {
      if (!enabled) return;

      const touches = event.touches;
      const gesture = gestureRef.current;

      if (touches.length === 2) {
        gesture.mode = 'pinch';
        gesture.startScale = scale;
        gesture.startDistance = distance(touches[0], touches[1]);
        gesture.startOffset = offset;
        return;
      }

      if (touches.length === 1) {
        gesture.startTouch = {
          x: touches[0].clientX,
          y: touches[0].clientY,
        };
        gesture.startOffset = offset;
        gesture.mode = scale > 1.01 ? 'pan' : 'swipe';
      }
    },
    [enabled, offset, scale]
  );

  const handleTouchMove = useCallback(
    (event: React.TouchEvent) => {
      if (!enabled) return;

      const touches = event.touches;
      const gesture = gestureRef.current;

      if (touches.length === 2 && gesture.mode === 'pinch') {
        event.preventDefault();
        const nextDistance = distance(touches[0], touches[1]);
        if (gesture.startDistance <= 0) return;

        const rawScale = gesture.startScale * (nextDistance / gesture.startDistance);
        const nextScale = clamp(rawScale, MIN_SCALE, MAX_SCALE);
        setScale(nextScale);
        setOffset(clampOffset(gesture.startOffset, nextScale));
        return;
      }

      if (touches.length === 1 && gesture.mode === 'pan' && scale > 1.01) {
        event.preventDefault();
        const dx = touches[0].clientX - gesture.startTouch.x;
        const dy = touches[0].clientY - gesture.startTouch.y;
        setOffset(
          clampOffset(
            {
              x: gesture.startOffset.x + dx,
              y: gesture.startOffset.y + dy,
            },
            scale
          )
        );
      }
    },
    [clampOffset, enabled, scale]
  );

  const handleTouchEnd = useCallback(
    (event: React.TouchEvent, onSwipe?: (result: SwipeResult) => void) => {
      if (!enabled) return;

      const gesture = gestureRef.current;

      if (event.touches.length > 0) {
        if (event.touches.length === 1) {
          gesture.mode = scale > 1.01 ? 'pan' : 'swipe';
          gesture.startTouch = {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY,
          };
          gesture.startOffset = offset;
        }
        return;
      }

      if (scale <= 1.05 && gesture.mode !== 'pinch') {
        setScale(1);
        setOffset({ x: 0, y: 0 });
      }

      const touch = event.changedTouches[0];
      if (touch) {
        const now = Date.now();
        const dx = touch.clientX - gesture.startTouch.x;
        const dy = touch.clientY - gesture.startTouch.y;

        if (Math.abs(dx) < 12 && Math.abs(dy) < 12) {
          if (now - gesture.lastTapAt < DOUBLE_TAP_MS) {
            if (scale > 1.01) {
              setScale(1);
              setOffset({ x: 0, y: 0 });
            } else {
              setScale(DOUBLE_TAP_SCALE);
              setOffset({ x: 0, y: 0 });
            }
            gesture.lastTapAt = 0;
            gesture.mode = 'idle';
            return;
          }
          gesture.lastTapAt = now;
        }
      }

      if (gesture.mode === 'swipe' && scale <= 1.01 && touch) {
        const dx = touch.clientX - gesture.startTouch.x;
        const dy = touch.clientY - gesture.startTouch.y;

        if (dy > 70 && dy > Math.abs(dx) * 1.2) {
          onSwipe?.({ direction: 'down' });
        } else if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
          onSwipe?.({ direction: dx > 0 ? 'right' : 'left' });
        }
      }

      gesture.mode = 'idle';
    },
    [enabled, offset, scale]
  );

  return {
    scale,
    offset,
    reset,
    containerRef,
    isZoomed: scale > 1.01,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
