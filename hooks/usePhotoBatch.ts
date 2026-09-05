import { useCallback, useEffect, useRef, useState } from 'react';

export const STAGE_PAGE_SIZE = 10;
export const FILTER_PAGE_SIZE = 36;

export function usePhotoBatch(total: number, pageSize: number, resetKey?: string) {
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisibleCount(pageSize);
  }, [total, pageSize, resetKey]);

  const loadMore = useCallback(() => {
    setVisibleCount((c) => Math.min(c + pageSize, total));
  }, [pageSize, total]);

  const hasMore = visibleCount < total;

  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadMore, visibleCount]);

  return { visibleCount, sentinelRef, hasMore, loadMore };
}
