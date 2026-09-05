import { useEffect, useRef, useState, useCallback } from 'react';

const BOTTOM_THRESHOLD_PX = 64;

export function useTimelineSync(stageIds: string[], scrollRoot?: HTMLElement | null) {
  const [activeStageId, setActiveStageId] = useState(stageIds[0] ?? '');
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementsRef = useRef<Map<string, HTMLElement>>(new Map());
  const pendingStageRef = useRef<string | null>(null);

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
      const el = document.getElementById(`stage-${stageId}`);
      if (!el) return;

      setActiveStageId(stageId);
      pendingStageRef.current = stageId;

      const releasePending = () => {
        pendingStageRef.current = null;
      };

      if (scrollRoot) {
        const rootTop = scrollRoot.getBoundingClientRect().top;
        const elTop = el.getBoundingClientRect().top;
        const nextTop = scrollRoot.scrollTop + (elTop - rootTop) - 8;
        const maxScroll = scrollRoot.scrollHeight - scrollRoot.clientHeight;
        scrollRoot.scrollTo({
          top: Math.min(Math.max(0, nextTop), maxScroll),
          behavior: 'smooth',
        });
        window.setTimeout(releasePending, 450);
      } else {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.setTimeout(releasePending, 450);
      }
    },
    [scrollRoot]
  );

  return { activeStageId, setActiveStageId, registerSection, scrollToStage };
}
