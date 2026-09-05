import { useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { PhotoFilter } from '../types';
import { EMPTY_FILTER } from '../utils/photoFilters';

interface UsePhotoDeepLinkOptions {
  filter: PhotoFilter;
  setFilter: React.Dispatch<React.SetStateAction<PhotoFilter>>;
  onOpenPhoto: (photoId: string) => void;
}

export function usePhotoDeepLink({ filter, setFilter, onOpenPhoto }: UsePhotoDeepLinkOptions) {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const table = searchParams.get('table');
    const name = searchParams.get('name');
    const next: PhotoFilter = { ...EMPTY_FILTER };

    if (table) {
      const n = parseInt(table, 10);
      if (!Number.isNaN(n)) next.table = n;
    }
    if (name) next.name = name;

    if (table || name) {
      setFilter(next);
    }

    const hash = window.location.hash.replace(/^#/, '');
    if (hash) {
      requestAnimationFrame(() => onOpenPhoto(hash));
    }
  }, []);

  const syncUrl = useCallback(
    (nextFilter: PhotoFilter, photoId?: string | null) => {
      const params = new URLSearchParams();
      if (nextFilter.table != null) params.set('table', String(nextFilter.table));
      if (nextFilter.name) params.set('name', nextFilter.name);

      const qs = params.toString();
      const hash = photoId ? `#${photoId}` : '';
      const path = `${window.location.pathname}${qs ? `?${qs}` : ''}${hash}`;
      window.history.replaceState(null, '', path);
    },
    []
  );

  const clearDeepLink = useCallback(() => {
    setSearchParams({});
    window.history.replaceState(null, '', window.location.pathname);
  }, [setSearchParams]);

  return { syncUrl, clearDeepLink };
}

export function buildPhotoShareUrl(photoId: string, filter?: PhotoFilter): string {
  const base = `${window.location.origin}${import.meta.env.BASE_URL}photo`;
  const params = new URLSearchParams();
  if (filter?.table != null) params.set('table', String(filter.table));
  if (filter?.name) params.set('name', filter.name);
  const qs = params.toString();
  return `${base}${qs ? `?${qs}` : ''}#${photoId}`;
}

export function buildPhotoShareTitle(filter?: PhotoFilter, names?: string[]): string {
  const base = 'Joy & Jacky 婚禮相簿';
  if (filter?.name) return `${base} — ${filter.name}`;
  if (filter?.table != null) return `${base} — 第 ${filter.table} 桌`;
  if (names && names.length > 0) return `${base} — ${names.slice(0, 2).join('、')}`;
  return base;
}
