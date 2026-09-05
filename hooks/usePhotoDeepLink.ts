import { useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { PhotoFilter } from '../types';
import { EMPTY_FILTER, filterLabel } from '../utils/photoFilters';

interface UsePhotoDeepLinkOptions {
  filter: PhotoFilter;
  setFilter: React.Dispatch<React.SetStateAction<PhotoFilter>>;
  onOpenPhoto: (photoId: string) => void;
}

function photoPageBase(): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${window.location.origin}${base}/photo`;
}

function filterToSearchParams(filter: PhotoFilter): URLSearchParams {
  const params = new URLSearchParams();
  if (filter.table != null) params.set('table', String(filter.table));
  if (filter.name) params.set('name', filter.name);
  if (filter.name && filter.nameScope === 'table') params.set('scope', 'table');
  if (filter.tag) params.set('tag', filter.tag.replace(/^#/, ''));
  if (filter.category && filter.category !== 'all') params.set('category', filter.category);
  return params;
}

function parseFilterFromSearchParams(searchParams: URLSearchParams): PhotoFilter | null {
  const table = searchParams.get('table');
  const name = searchParams.get('name');
  const scope = searchParams.get('scope');
  const tag = searchParams.get('tag');
  const category = searchParams.get('category');

  if (!table && !name && !tag && !category) return null;

  const next: PhotoFilter = { ...EMPTY_FILTER };

  if (table) {
    const n = parseInt(table, 10);
    if (!Number.isNaN(n)) {
      next.table = n;
      next.query = String(n);
    }
  }
  if (name) {
    next.name = name;
    next.query = name;
  }
  if (scope === 'table') next.nameScope = 'table';
  if (tag) {
    next.tag = tag;
    next.query = tag;
  }
  if (category) next.category = category;

  return next;
}

export function buildFilterShareUrl(filter: PhotoFilter, photoId?: string | null): string {
  const params = filterToSearchParams(filter);
  const qs = params.toString();
  const hash = photoId ? `#${photoId}` : '';
  return `${photoPageBase()}${qs ? `?${qs}` : ''}${hash}`;
}

export function buildFilterShareTitle(filter: PhotoFilter): string {
  const base = 'Joy & Jacky 婚禮相簿';
  const label = filterLabel(filter);
  return label ? `${base} — ${label}` : base;
}

export function buildPhotoShareUrl(photoId: string, filter?: PhotoFilter): string {
  return buildFilterShareUrl(filter ?? EMPTY_FILTER, photoId);
}

export function buildPhotoShareTitle(filter?: PhotoFilter, names?: string[]): string {
  if (filter) {
    const label = filterLabel(filter);
    if (label) return buildFilterShareTitle(filter);
  }
  const base = 'Joy & Jacky 婚禮相簿';
  if (names && names.length > 0) return `${base} — ${names.slice(0, 2).join('、')}`;
  return base;
}

export async function shareFilterLink(filter: PhotoFilter): Promise<'shared' | 'copied'> {
  const url = buildFilterShareUrl(filter);
  const title = buildFilterShareTitle(filter);

  if (navigator.share) {
    try {
      await navigator.share({ title, text: title, url });
      return 'shared';
    } catch {
      /* fall through */
    }
  }

  await navigator.clipboard.writeText(url);
  return 'copied';
}

export function usePhotoDeepLink({ filter, setFilter, onOpenPhoto }: UsePhotoDeepLinkOptions) {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const parsed = parseFilterFromSearchParams(searchParams);
    if (parsed) setFilter(parsed);

    const hash = window.location.hash.replace(/^#/, '');
    if (hash) {
      requestAnimationFrame(() => onOpenPhoto(hash));
    }
  }, []);

  const syncUrl = useCallback((nextFilter: PhotoFilter, photoId?: string | null) => {
    const params = filterToSearchParams(nextFilter);
    const qs = params.toString();
    const hash = photoId ? `#${photoId}` : '';
    const path = `${window.location.pathname}${qs ? `?${qs}` : ''}${hash}`;
    window.history.replaceState(null, '', path);
  }, []);

  const clearDeepLink = useCallback(() => {
    setSearchParams({});
    window.history.replaceState(null, '', window.location.pathname);
  }, [setSearchParams]);

  return { syncUrl, clearDeepLink, shareFilterLink };
}
