import { useEffect, useRef, useState, useCallback } from 'react';

export function useTimelineSync(stageIds: string[], scrollRoot?: HTMLElement | null) {
  const [activeStageId, setActiveStageId] = useState(stageIds[0] ?? '');
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementsRef = useRef<Map<string, HTMLElement>>(new Map());

  useEffect(() => {
    if (stageIds.length && !stageIds.includes(activeStageId)) {
      setActiveStageId(stageIds[0]);
    }
  }, [stageIds, activeStageId]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
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

      if (scrollRoot) {
        const rootTop = scrollRoot.getBoundingClientRect().top;
        const elTop = el.getBoundingClientRect().top;
        const nextTop = scrollRoot.scrollTop + (elTop - rootTop) - 8;
        scrollRoot.scrollTo({ top: Math.max(0, nextTop), behavior: 'smooth' });
      } else {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      setActiveStageId(stageId);
    },
    [scrollRoot]
  );

  return { activeStageId, setActiveStageId, registerSection, scrollToStage };
}
