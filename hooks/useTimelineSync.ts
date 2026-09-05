import { useEffect, useRef, useState, useCallback } from 'react';

const BOTTOM_THRESHOLD_PX = 64;
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

export function useTimelineSync(stageIds: string[], scrollRoot?: HTMLElement | null) {
  const [activeStageId, setActiveStageId] = useState(stageIds[0] ?? '');
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementsRef = useRef<Map<string, HTMLElement>>(new Map());
  const pendingStageRef = useRef<string | null>(null);
  const scrollCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (stageIds.length && !stageIds.includes(activeStageId)) {
      setActiveStageId(stageIds[0]);
    }
  }, [stageIds, activeStageId]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (pendingStageRef.current) return;

        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0];
        if (top?.target instanceof HTMLElement && top.target.dataset.stageId) {
          setActiveStageId(top.target.dataset.stageId);
        }
      },
      {
        root: scrollRoot ?? null,
        rootMargin: scrollRoot ? '-8% 0px -45% 0px' : '-20% 0px -55% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    elementsRef.current.forEach((el) => observerRef.current?.observe(el));

    return () => observerRef.current?.disconnect();
  }, [stageIds.join(','), scrollRoot]);

  useEffect(() => {
    if (!scrollRoot || stageIds.length === 0) return;

    const onScroll = () => {
      if (pendingStageRef.current) return;
      const nearBottom =
        scrollRoot.scrollTop + scrollRoot.clientHeight >=
        scrollRoot.scrollHeight - BOTTOM_THRESHOLD_PX;
      if (nearBottom) {
        setActiveStageId(stageIds[stageIds.length - 1]);
      }
    };

    scrollRoot.addEventListener('scroll', onScroll, { passive: true });
    return () => scrollRoot.removeEventListener('scroll', onScroll);
  }, [scrollRoot, stageIds.join(',')]);

  useEffect(
    () => () => {
      scrollCleanupRef.current?.();
    },
    []
  );

  const registerSection = useCallback(
    (id: string) => (el: HTMLElement | null) => {
      const prev = elementsRef.current.get(id);
      if (prev) observerRef.current?.unobserve(prev);

      if (el) {
        elementsRef.current.set(id, el);
        observerRef.current?.observe(el);
      } else {
        elementsRef.current.delete(id);
      }
    },
    []
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
    [scrollRoot]
  );

  return { activeStageId, setActiveStageId, registerSection, scrollToStage };
}
