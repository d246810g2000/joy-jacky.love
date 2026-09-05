import { useEffect, useRef, useState, useCallback } from 'react';

const TOP_THRESHOLD_PX = 32;
const BOTTOM_THRESHOLD_PX = 64;
const DEFAULT_ANCHOR_OFFSET_PX = 16;
const DESKTOP_ANCHOR_OFFSET_PX = 96;
const SCROLL_RETRY_MS = 80;
const SCROLL_RETRY_MAX = 40;
const LAYOUT_SETTLE_MS = 500;
const USER_SCROLL_RELEASE_PX = 8;
const USER_SCROLL_DRIFT_PX = 48;
const SCROLL_END_DEBOUNCE_MS = 80;

export interface TimelineSyncOptions {
  /** Banner top must reach this distance from scroll container top to become active. */
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

/** Distance from scroll container top to banner marker top edge. */
function getBannerTop(
  marker: HTMLElement,
  scrollRoot: HTMLElement | null,
  rootTop: number
): number {
  return marker.getBoundingClientRect().top - rootTop;
}

function findStageMarker(stageId: string, markers: Map<string, HTMLElement>): HTMLElement | null {
  return (
    markers.get(stageId) ??
    document.querySelector<HTMLElement>(`[data-stage-marker="${stageId}"]`)
  );
}

function scrollMarkerIntoRoot(
  marker: HTMLElement,
  scrollRoot: HTMLElement,
  behavior: ScrollBehavior = 'smooth',
  anchorOffset = DEFAULT_ANCHOR_OFFSET_PX
) {
  const rootTop = scrollRoot.getBoundingClientRect().top;
  const markerTop = marker.getBoundingClientRect().top;
  const nextTop = scrollRoot.scrollTop + (markerTop - rootTop) - anchorOffset;
  const maxScroll = scrollRoot.scrollHeight - scrollRoot.clientHeight;
  scrollRoot.scrollTo({
    top: Math.min(Math.max(0, nextTop), maxScroll),
    behavior,
  });
}

/**
 * Active chapter = last banner whose top edge has crossed the activation line.
 * If the next banner is still below that line (common with 10-photo previews),
 * we stay on the previous chapter even when its banner is visible lower on screen.
 */
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
  const bannerTops: { id: string; top: number }[] = [];

  for (const id of stageIds) {
    const marker = markers.get(id);
    if (!marker) continue;
    bannerTops.push({ id, top: getBannerTop(marker, scrollRoot, rootTop) });
  }

  if (bannerTops.length === 0) return stageIds[0];

  let lastPassedId = bannerTops[0].id;
  for (const banner of bannerTops) {
    if (banner.top <= activationLine) {
      lastPassedId = banner.id;
      continue;
    }
    // Next banner hasn't reached the activation line yet → previous chapter stays active.
    return lastPassedId;
  }

  return lastPassedId;
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
  const scrollEndTimerRef = useRef<number | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const stageIdsRef = useRef(stageIds);
  const scrollRootRef = useRef(scrollRoot ?? null);
  const anchorOffsetRef = useRef(anchorOffset);

  stageIdsRef.current = stageIds;
  scrollRootRef.current = scrollRoot ?? null;
  anchorOffsetRef.current = anchorOffset;

  const syncActiveStage = useCallback(() => {
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

  const scheduleScrollEndSync = useCallback(() => {
    if (scrollEndTimerRef.current != null) {
      window.clearTimeout(scrollEndTimerRef.current);
    }
    scrollEndTimerRef.current = window.setTimeout(() => {
      scrollEndTimerRef.current = null;
      syncActiveStage();
    }, SCROLL_END_DEBOUNCE_MS);
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
    syncActiveStage();
  }, [stageIds.join(','), scrollRoot, anchorOffset, syncActiveStage]);

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
      scheduleScrollEndSync();
    };

    const onScrollEnd = () => {
      syncActiveStage();
    };

    target.addEventListener('scroll', onScroll, { passive: true });
    target.addEventListener('scrollend', onScrollEnd, { passive: true });
    return () => {
      target.removeEventListener('scroll', onScroll);
      target.removeEventListener('scrollend', onScrollEnd);
      if (scrollEndTimerRef.current != null) {
        window.clearTimeout(scrollEndTimerRef.current);
      }
    };
  }, [scrollRoot, scheduleSync, scheduleScrollEndSync, syncActiveStage, releasePending]);

  useEffect(() => {
    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      () => {
        scheduleSync();
        scheduleScrollEndSync();
      },
      {
        root: scrollRoot ?? null,
        rootMargin: `-${anchorOffset}px 0px -88% 0px`,
        threshold: [0, 0.01, 0.25, 0.5, 1],
      }
    );

    markersRef.current.forEach((marker) => observerRef.current?.observe(marker));

    return () => observerRef.current?.disconnect();
  }, [scrollRoot, stageIds.join(','), anchorOffset, scheduleSync, scheduleScrollEndSync]);

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
      if (scrollEndTimerRef.current != null) window.clearTimeout(scrollEndTimerRef.current);
    },
    []
  );

  const registerSection = useCallback(
    (id: string) => (el: HTMLElement | null) => {
      const prev = markersRef.current.get(id);
      if (prev) observerRef.current?.unobserve(prev);

      if (el) {
        markersRef.current.set(id, el);
        observerRef.current?.observe(el);
      } else {
        markersRef.current.delete(id);
      }

      scheduleSync();
    },
    [scheduleSync]
  );

  const scrollToStage = useCallback(
    (stageId: string) => {
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
        const marker = findStageMarker(stageId, markersRef.current);
        if (!marker) return false;

        if (scrollRoot) {
          const rootTop = scrollRoot.getBoundingClientRect().top;
          const markerTop = marker.getBoundingClientRect().top;
          targetScrollTopRef.current = Math.max(
            0,
            scrollRoot.scrollTop + (markerTop - rootTop) - anchorOffsetRef.current
          );
          scrollMarkerIntoRoot(marker, scrollRoot, behavior, anchorOffsetRef.current);
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
          scheduleSync();
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
    [scrollRoot, syncActiveStage, scheduleSync]
  );

  return { activeStageId, setActiveStageId, registerSection, scrollToStage };
}

export { DEFAULT_ANCHOR_OFFSET_PX, DESKTOP_ANCHOR_OFFSET_PX };
