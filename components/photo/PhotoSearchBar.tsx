import React, { useEffect, useRef, useState } from 'react';
import { addRecentSearch, getRecentSearches } from '../../utils/photoRecentSearch';
import type { NameSearchScope } from '../../types';
import { PhotoNameScopeBar } from './PhotoNameScopeBar';

interface PhotoSearchBarProps {
  resultCount: number | null;
  hasFilter: boolean;
  filterLabel?: string | null;
  hidden?: boolean;
  autoExpand?: boolean;
  variant?: 'fixed' | 'dock';
  onSearch: (query: string) => void;
  onOpenDrawer: () => void;
  onClearFilter?: () => void;
  onExpandHandled?: () => void;
  nameScope?: NameSearchScope;
  onNameScopeChange?: (scope: NameSearchScope) => void;
  guestTable?: number | null;
  showNameScope?: boolean;
}

export const PhotoSearchBar: React.FC<PhotoSearchBarProps> = ({
  resultCount,
  hasFilter,
  filterLabel,
  hidden = false,
  autoExpand = false,
  variant = 'fixed',
  onSearch,
  onOpenDrawer,
  onClearFilter,
  onExpandHandled,
  nameScope = 'person',
  onNameScopeChange,
  guestTable,
  showNameScope = false,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (expanded) {
      setRecent(getRecentSearches());
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [expanded]);

  useEffect(() => {
    if (autoExpand) {
      setExpanded(true);
      onExpandHandled?.();
    }
  }, [autoExpand, onExpandHandled]);

  if (hidden) return null;

  const isDock = variant === 'dock';

  const submit = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    addRecentSearch(trimmed);
    onSearch(trimmed);
    setExpanded(false);
    setQuery('');
  };

  return (
    <>
      {expanded && !isDock && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setExpanded(false)}
          aria-hidden
        />
      )}

      <div
        className={
          isDock
            ? 'relative w-full'
            : 'fixed bottom-4 left-1/2 z-50 w-[min(94vw,420px)] -translate-x-1/2 photo-safe-bottom'
        }
      >
        {expanded && (
          <div
            className={`photo-search-panel overflow-hidden rounded-2xl border border-white/12 p-3 shadow-2xl backdrop-blur-xl ${
              isDock ? 'mb-2' : 'mb-2'
            }`}
          >
            <p className="mb-2 px-1 text-[11px] tracking-wide text-white/45">找您的婚禮照片</p>
            <div className="relative">
              <span
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35"
                aria-hidden
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
                </svg>
              </span>
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submit(query);
                  if (e.key === 'Escape') setExpanded(false);
                }}
                placeholder="輸入姓名或桌號…"
                className="photo-search-input w-full rounded-xl border border-white/10 bg-black/50 py-3 pl-10 pr-4 text-base text-white placeholder:text-white/35 focus:border-[var(--photo-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--photo-accent)]/40"
                autoComplete="off"
                enterKeyHint="search"
              />
            </div>
            {recent.length > 0 && (
              <div className="mt-2.5">
                <p className="mb-1.5 px-1 text-[10px] text-white/35">最近搜尋</p>
                <div className="flex flex-wrap gap-1.5">
                  {recent.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => submit(r)}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 transition active:bg-white/10"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={() => submit(query)}
              className="mt-3 w-full rounded-xl bg-gradient-to-r from-[var(--photo-gold-dark)] to-[var(--photo-accent)] py-2.5 text-sm font-medium text-white shadow-lg shadow-[var(--photo-warm-glow)]"
            >
              開始搜尋
            </button>
          </div>
        )}

        {showNameScope && onNameScopeChange && (
          <PhotoNameScopeBar
            scope={nameScope}
            onScopeChange={onNameScopeChange}
            guestTable={guestTable}
            compact
          />
        )}

        <div
          className={`photo-search-bar flex items-center gap-2 rounded-2xl border px-2 py-1.5 shadow-xl backdrop-blur-xl ${
            hasFilter
              ? 'border-[var(--photo-accent)]/35 bg-[var(--photo-accent)]/8'
              : 'border-white/12 bg-[#141210]/92'
          } ${showNameScope ? 'mt-2' : ''}`}
        >
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-2.5 py-2 text-left active:bg-white/5"
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                hasFilter ? 'bg-[var(--photo-accent)]/25 text-[var(--photo-gold-light)]' : 'bg-white/8 text-white/50'
              }`}
              aria-hidden
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              {hasFilter && filterLabel ? (
                <>
                  <p className="truncate text-sm font-medium text-white/95">{filterLabel}</p>
                  {resultCount != null && (
                    <p className="text-[10px] text-white/45">{resultCount} 張照片</p>
                  )}
                </>
              ) : (
                <>
                  <p className="text-sm text-white/75">搜尋姓名或桌號</p>
                  <p className="text-[10px] text-white/35">點擊輸入，快速找到您的照片</p>
                </>
              )}
            </div>
          </button>
          {hasFilter && onClearFilter && (
            <button
              type="button"
              onClick={onClearFilter}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/55 active:bg-white/10"
              aria-label="清除篩選"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <button
            type="button"
            onClick={onOpenDrawer}
            className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 active:bg-white/10"
            aria-label="進階篩選"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M7 12h10M10 18h4" />
            </svg>
            {hasFilter && resultCount != null && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--photo-accent)] px-1 text-[9px] font-medium text-white">
                {resultCount > 99 ? '99+' : resultCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </>
  );
};
