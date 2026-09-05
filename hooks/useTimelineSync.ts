import { useEffect, useRef, useState, useCallback } from 'react';

const TOP_THRESHOLD_PX = 48;
const BOTTOM_THRESHOLD_PX = 64;
// The active chapter should change when its banner reaches the content top,
// not merely when it enters the lower part of the viewport.
const ACTIVE_STAGE_OFFSET_PX = 48;
const SCROLL_RETRY_MS = 80;
const SCROLL_RETRY_MAX = 40;
const LAYOUT_SETTLE_MS = 2400;

function scrollElementIntoRoot(
  el: HTMLElement,
  scrollRoot: HTMLElement,
  behavior: ScrollBehavior = 'smooth'
) {
  const rootTop = scrollRoot.getBoundingClientRect().top;
  const elTop = el.getBoundingClientRect().top;
  const nextTop = scrollRoot.scrollTop + (elTop - rootTop) - 8;
  const maxScroll = scrollRoot.scrollHeight - scrollRoot.clientHeight;
  scrollRoot.scrollTo({
    top: Math.min(Math.max(0, nextTop), maxScroll),
    behavior,
  });
}

function resolveActiveStage(
  stageIds: string[],
  elements: Map<string, HTMLElement>,
  scrollRoot: HTMLElement | null
): string | null {
  if (stageIds.length === 0) return null;

  let scrollTop: number;
  let viewportHeight: number;
  let scrollHeight: number;
  let rootTop: number;

  if (scrollRoot) {
    scrollTop = scrollRoot.scrollTop;
    viewportHeight = scrollRoot.clientHeight;
    scrollHeight = scrollRoot.scrollHeight;
    rootTop = scrollRoot.getBoundingClientRect().top;
  } else {
    scrollTop = window.scrollY || document.documentElement.scrollTop;
    viewportHeight = window.innerHeight;
    scrollHeight = document.documentElement.scrollHeight;
    rootTop = 0;
  }

  if (scrollTop <= TOP_THRESHOLD_PX) {
    return stageIds[0];
  }

  if (scrollTop + viewportHeight >= scrollHeight - BOTTOM_THRESHOLD_PX) {
    return stageIds[stageIds.length - 1];
  }

  const referenceY = rootTop + ACTIVE_STAGE_OFFSET_PX;

  let activeId = stageIds[0];
  for (const id of stageIds) {
    const el = elements.get(id);
    if (!el) continue;
    const rect = el.getBoundingClientRect();
    if (rect.top <= referenceY) {
      activeId = id;
    } else {
      break;
    }
  }

  return activeId;
}

export function useTimelineSync(stageIds: string[], scrollRoot?: HTMLElement | null) {
  const [activeStageId, setActiveStageId] = useState(stageIds[0] ?? '');
  const elementsRef = useRef<Map<string, HTMLElement>>(new Map());
  const pendingStageRef = useRef<string | null>(null);
  const scrollCleanupRef = useRef<(() => void) | null>(null);
  const rafRef = useRef<number | null>(null);
  const stageIdsRef = useRef(stageIds);
  const scrollRootRef = useRef(scrollRoot ?? null);

  stageIdsRef.current = stageIds;
  scrollRootRef.current = scrollRoot ?? null;

  const syncActiveStage = useCallback(() => {
    if (pendingStageRef.current) return;

    const next = resolveActiveStage(
      stageIdsRef.current,
      elementsRef.current,
      scrollRootRef.current
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

  useEffect(() => {
    if (stageIds.length && !stageIds.includes(activeStageId)) {
      setActiveStageId(stageIds[0]);
    }
  }, [stageIds, activeStageId]);

  useEffect(() => {
    scheduleSync();
  }, [stageIds.join(','), scrollRoot, scheduleSync]);

  useEffect(() => {
    const target = scrollRoot ?? window;
    const onScroll = () => scheduleSync();

    target.addEventListener('scroll', onScroll, { passive: true });
    return () => target.removeEventListener('scroll', onScroll);
  }, [scrollRoot, scheduleSync]);

  useEffect(() => {
    if (!scrollRoot) {
      const onResize = () => scheduleSync();
      window.addEventListener('resize', onResize, { passive: true });
      return () => window.removeEventListener('resize', onResize);
    }

    const resizeObserver = new ResizeObserver(() => scheduleSync());
    resizeObserver.observe(scrollRoot);
    elementsRef.current.forEach((node) => resizeObserver.observe(node));

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
        elementsRef.current.set(id, el);
      } else {
        elementsRef.current.delete(id);
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

      const releasePending = () => {
        pendingStageRef.current = null;
        resizeObserver?.disconnect();
        resizeObserver = null;
        if (retryTimer != null) window.clearTimeout(retryTimer);
        if (settleTimer != null) window.clearTimeout(settleTimer);
        scrollCleanupRef.current = null;
        syncActiveStage();
      };

      const performScroll = (behavior: ScrollBehavior) => {
        const el = document.getElementById(`stage-${stageId}`);
        if (!el) return false;

        if (scrollRoot) {
          scrollElementIntoRoot(el, scrollRoot, behavior);
        } else {
          el.scrollIntoView({ behavior, block: 'start' });
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
          elementsRef.current.forEach((node) => resizeObserver?.observe(node));
        }

        settleTimer = window.setTimeout(releasePending, LAYOUT_SETTLE_MS);
      };

      const attemptScroll = (attempt = 0) => {
        if (performScroll(attempt === 0 ? 'smooth' : 'auto')) {
          beginSettling();
          return;
        }

        if (attempt >= SCROLL_RETRY_MAX) {
          releasePending();
          return;
        }

        retryTimer = window.setTimeout(() => attemptScroll(attempt + 1), SCROLL_RETRY_MS);
      };

      scrollCleanupRef.current = releasePending;
      attemptScroll();
    },
    [scrollRoot, syncActiveStage]
  );

  return { activeStageId, setActiveStageId, registerSection, scrollToStage };
}
