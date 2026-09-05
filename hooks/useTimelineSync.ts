import { useEffect, useRef, useState, useCallback } from 'react';

const TOP_THRESHOLD_PX = 32;
const BOTTOM_THRESHOLD_PX = 64;
const DEFAULT_ANCHOR_OFFSET_PX = 24;
const DESKTOP_ANCHOR_OFFSET_PX = 96;
const SCROLL_RETRY_MS = 80;
const SCROLL_RETRY_MAX = 40;
const LAYOUT_SETTLE_MS = 900;
const USER_SCROLL_RELEASE_PX = 12;
const USER_SCROLL_DRIFT_PX = 56;

export interface TimelineSyncOptions {
  /** Distance from scroll container top before a chapter banner counts as active. */
  anchorOffset?: number;
}

function getScrollMetrics(scrollRoot: HTMLElement | null) {
  if (scrollRoot) {
    return {
      scrollTop: scrollRoot.scrollTop,
      viewportHeight: scrollRoot.clientHeight,
      scrollHeight: scrollRoot.scrollHeight,
      rootTop: scrollRoot.getBoundingClientRect().top,
    };
  }

  return {
    scrollTop: window.scrollY || document.documentElement.scrollTop,
    viewportHeight: window.innerHeight,
    scrollHeight: document.documentElement.scrollHeight,
    rootTop: 0,
  };
}

function getMarkerViewportOffset(
  marker: HTMLElement,
  scrollRoot: HTMLElement | null,
  rootTop: number
): number {
  return marker.getBoundingClientRect().top - rootTop;
}

function scrollElementIntoRoot(
  el: HTMLElement,
  scrollRoot: HTMLElement,
  behavior: ScrollBehavior = 'smooth',
  anchorOffset = DEFAULT_ANCHOR_OFFSET_PX
) {
  const rootTop = scrollRoot.getBoundingClientRect().top;
  const elTop = el.getBoundingClientRect().top;
  const nextTop = scrollRoot.scrollTop + (elTop - rootTop) - anchorOffset;
  const maxScroll = scrollRoot.scrollHeight - scrollRoot.clientHeight;
  scrollRoot.scrollTo({
    top: Math.min(Math.max(0, nextTop), maxScroll),
    behavior,
  });
}

function resolveActiveStage(
  stageIds: string[],
  markers: Map<string, HTMLElement>,
  scrollRoot: HTMLElement | null,
  anchorOffset: number
): string | null {
  if (stageIds.length === 0) return null;

  const { scrollTop, viewportHeight, scrollHeight, rootTop } = getScrollMetrics(scrollRoot);

  if (scrollTop <= TOP_THRESHOLD_PX) {
    return stageIds[0];
  }

  if (scrollTop + viewportHeight >= scrollHeight - BOTTOM_THRESHOLD_PX) {
    return stageIds[stageIds.length - 1];
  }

  const activationLine = anchorOffset;

  let activeId = stageIds[0];
  for (const id of stageIds) {
    const marker = markers.get(id);
    if (!marker) continue;

    const markerOffset = getMarkerViewportOffset(marker, scrollRoot, rootTop);
    if (markerOffset <= activationLine) {
      activeId = id;
    } else {
      break;
    }
  }

  return activeId;
}

export function useTimelineSync(
  stageIds: string[],
  scrollRoot?: HTMLElement | null,
  options: TimelineSyncOptions = {}
) {
  const anchorOffset = options.anchorOffset ?? DEFAULT_ANCHOR_OFFSET_PX;
  const [activeStageId, setActiveStageId] = useState(stageIds[0] ?? '');
  const markersRef = useRef<Map<string, HTMLElement>>(new Map());
  const pendingStageRef = useRef<string | null>(null);
  const targetScrollTopRef = useRef<number | null>(null);
  const lastScrollTopRef = useRef(0);
  const scrollCleanupRef = useRef<(() => void) | null>(null);
  const rafRef = useRef<number | null>(null);
  const stageIdsRef = useRef(stageIds);
  const scrollRootRef = useRef(scrollRoot ?? null);
  const anchorOffsetRef = useRef(anchorOffset);

  stageIdsRef.current = stageIds;
  scrollRootRef.current = scrollRoot ?? null;
  anchorOffsetRef.current = anchorOffset;

  const syncActiveStage = useCallback(() => {
    if (pendingStageRef.current) return;

    const next = resolveActiveStage(
      stageIdsRef.current,
      markersRef.current,
      scrollRootRef.current,
      anchorOffsetRef.current
    );
    if (next) {
      setActiveStageId((prev) => (prev === next ? prev : next));
    }
  }, []);

  const scheduleSync = useCallback(() => {
    if (rafRef.current != null) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      syncActiveStage();
    });
  }, [syncActiveStage]);

  const releasePending = useCallback(() => {
    pendingStageRef.current = null;
    targetScrollTopRef.current = null;
    scrollCleanupRef.current?.();
    scrollCleanupRef.current = null;
    syncActiveStage();
  }, [syncActiveStage]);

  useEffect(() => {
    if (stageIds.length && !stageIds.includes(activeStageId)) {
      setActiveStageId(stageIds[0]);
    }
  }, [stageIds, activeStageId]);

  useEffect(() => {
    scheduleSync();
  }, [stageIds.join(','), scrollRoot, anchorOffset, scheduleSync]);

  useEffect(() => {
    const target = scrollRoot ?? window;

    const onScroll = () => {
      const metrics = getScrollMetrics(scrollRoot ?? null);
      const previousScrollTop = lastScrollTopRef.current;
      lastScrollTopRef.current = metrics.scrollTop;

      if (pendingStageRef.current) {
        const moved = Math.abs(metrics.scrollTop - previousScrollTop);
        const targetTop = targetScrollTopRef.current;
        const drift =
          targetTop == null ? moved : Math.abs(metrics.scrollTop - targetTop);

        if (moved >= USER_SCROLL_RELEASE_PX && drift >= USER_SCROLL_DRIFT_PX) {
          releasePending();
        }
      }

      scheduleSync();
    };

    target.addEventListener('scroll', onScroll, { passive: true });
    return () => target.removeEventListener('scroll', onScroll);
  }, [scrollRoot, scheduleSync, releasePending]);

  useEffect(() => {
    if (!scrollRoot) {
      const onResize = () => scheduleSync();
      window.addEventListener('resize', onResize, { passive: true });
      return () => window.removeEventListener('resize', onResize);
    }

    const resizeObserver = new ResizeObserver(() => scheduleSync());
    resizeObserver.observe(scrollRoot);
    markersRef.current.forEach((node) => resizeObserver.observe(node));

    return () => resizeObserver.disconnect();
  }, [scrollRoot, stageIds.join(','), scheduleSync]);

  useEffect(
    () => () => {
      scrollCleanupRef.current?.();
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
    },
    []
  );

  const registerSection = useCallback(
    (id: string) => (el: HTMLElement | null) => {
      if (el) {
        markersRef.current.set(id, el);
      } else {
        markersRef.current.delete(id);
      }
      scheduleSync();
    },
    [scheduleSync]
  );

  const scrollToStage = useCallback(
    (stageId: string) => {
      setActiveStageId(stageId);
      pendingStageRef.current = stageId;
      scrollCleanupRef.current?.();

      let retryTimer: number | null = null;
      let settleTimer: number | null = null;
      let resizeObserver: ResizeObserver | null = null;
      let correctionCount = 0;

      const cleanupPendingTimers = () => {
        resizeObserver?.disconnect();
        resizeObserver = null;
        if (retryTimer != null) window.clearTimeout(retryTimer);
        if (settleTimer != null) window.clearTimeout(settleTimer);
      };

      const finishPending = () => {
        pendingStageRef.current = null;
        targetScrollTopRef.current = null;
        cleanupPendingTimers();
        scrollCleanupRef.current = null;
        syncActiveStage();
      };

      const performScroll = (behavior: ScrollBehavior) => {
        const marker = markersRef.current.get(stageId) ?? document.getElementById(`stage-${stageId}`);
        if (!marker) return false;

        if (scrollRoot) {
          const rootTop = scrollRoot.getBoundingClientRect().top;
          const elTop = marker.getBoundingClientRect().top;
          targetScrollTopRef.current = Math.max(
            0,
            scrollRoot.scrollTop + (elTop - rootTop) - anchorOffsetRef.current
          );
          scrollElementIntoRoot(marker, scrollRoot, behavior, anchorOffsetRef.current);
        } else {
          marker.scrollIntoView({ behavior, block: 'start' });
          targetScrollTopRef.current = window.scrollY || document.documentElement.scrollTop;
        }
        return true;
      };

      const correctScroll = () => {
        if (!pendingStageRef.current || correctionCount > 24) return;
        correctionCount += 1;
        performScroll('auto');
      };

      const beginSettling = () => {
        if (scrollRoot) {
          resizeObserver = new ResizeObserver(() => {
            window.requestAnimationFrame(correctScroll);
          });
          resizeObserver.observe(scrollRoot);
          markersRef.current.forEach((node) => resizeObserver?.observe(node));
        }

        settleTimer = window.setTimeout(finishPending, LAYOUT_SETTLE_MS);
      };

      const attemptScroll = (attempt = 0) => {
        if (performScroll(attempt === 0 ? 'smooth' : 'auto')) {
          beginSettling();
          return;
        }

        if (attempt >= SCROLL_RETRY_MAX) {
          finishPending();
          return;
        }

        retryTimer = window.setTimeout(() => attemptScroll(attempt + 1), SCROLL_RETRY_MS);
      };

      scrollCleanupRef.current = finishPending;
      attemptScroll();
    },
    [scrollRoot, syncActiveStage]
  );

  return { activeStageId, setActiveStageId, registerSection, scrollToStage };
}

export { DEFAULT_ANCHOR_OFFSET_PX, DESKTOP_ANCHOR_OFFSET_PX };
