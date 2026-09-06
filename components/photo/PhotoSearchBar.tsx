import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { addRecentSearch, getRecentSearches } from '../../utils/photoRecentSearch';
import type { GuestRecord, NameSearchScope } from '../../types';
import { PhotoNameScopeBar } from './PhotoNameScopeBar';
import { GUEST_RECORDS, formatGuestSubtitle, searchGuests } from '../../utils/guestIndex';
import { formatTableLabel } from '../../utils/tableLabels';
import { PhotoSearchFilterSections } from './PhotoSearchFilterSections';
import { shouldPreferMobilePhotoShare } from '../../utils/photoDownload';

interface PhotoSearchBarProps {
  resultCount: number | null;
  hasFilter: boolean;
  filterLabel?: string | null;
  hidden?: boolean;
  autoExpand?: boolean;
  variant?: 'fixed' | 'dock';
  onSearch: (query: string) => void;
  onTagSearch?: (tag: string) => void;
  onTableSelect?: (table: number) => void;
  onClearFilter?: () => void;
  onDownloadAll?: () => void;
  onShareFilter?: () => void;
  downloading?: boolean;
  downloadProgress?: {
    done: number;
    total: number;
    part?: number;
    parts?: number;
    mode?: 'zip' | 'share';
  } | null;
  onExpandHandled?: () => void;
  nameScope?: NameSearchScope;
  onNameScopeChange?: (scope: NameSearchScope) => void;
  guestTable?: number | null;
  featuredGuestPhotos?: Record<
    string,
    { publicId: string; face: { x: number; y: number; w: number; h: number } } | undefined
  >;
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
  onTagSearch,
  onTableSelect,
  onClearFilter,
  onDownloadAll,
  onShareFilter,
  downloading = false,
  downloadProgress = null,
  onExpandHandled,
  nameScope = 'person',
  onNameScopeChange,
  guestTable,
  featuredGuestPhotos,
  showNameScope = false,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchHistoryRef = useRef(false);
  const isDock = variant === 'dock';
  const suggestions = useMemo(
    () => (query.trim().length > 0 ? searchGuests(query, 5) : []),
    [query]
  );
  const featuredGuests = useMemo(() => {
    return ['李謦伊', '張家銘']
      .map((name) => GUEST_RECORDS.find((guest) => guest.name === name))
      .filter((guest): guest is GuestRecord => Boolean(guest));
  }, []);
  const exactTable = useMemo(() => {
    const trimmed = query.trim();
    if (!/^\d{1,2}$/.test(trimmed)) return null;
    const table = Number(trimmed);
    return table >= 1 && table <= 27 ? table : null;
  }, [query]);

  const openSearch = useCallback(() => {
    setExpanded(true);
    if (isDock && !searchHistoryRef.current) {
      window.history.pushState(
        { ...(window.history.state ?? {}), photoSearch: true },
        '',
        window.location.href
      );
      searchHistoryRef.current = true;
    }
  }, [isDock]);

  const closeSearch = useCallback(
    (fromPopState = false) => {
      const shouldRestoreHistory = isDock && searchHistoryRef.current;
      searchHistoryRef.current = false;
      setExpanded(false);
      setQuery('');
      if (shouldRestoreHistory && !fromPopState) {
        window.history.back();
      }
    },
    [isDock]
  );

  useEffect(() => {
    if (!isDock) return;
    const handlePopState = () => {
      if (!searchHistoryRef.current) return;
      closeSearch(true);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [closeSearch, isDock]);

  useEffect(() => {
    if (expanded) {
      setRecent(getRecentSearches());
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [expanded]);

  useEffect(() => {
    if (autoExpand) {
      openSearch();
      onExpandHandled?.();
    }
  }, [autoExpand, onExpandHandled, openSearch]);

  if (hidden) return null;

  const submit = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    addRecentSearch(trimmed);
    onSearch(trimmed);
    closeSearch();
  };

  const submitTag = (tag: string) => {
    const cleanTag = tag.replace(/^#/, '').trim();
    if (!cleanTag) return;
    addRecentSearch(cleanTag);
    onTagSearch?.(cleanTag);
    closeSearch();
  };

  const selectTable = (table: number) => {
    addRecentSearch(String(table));
    if (onTableSelect) {
      onTableSelect(table);
    } else {
      onSearch(String(table));
    }
    closeSearch();
  };

  return (
    <>
      {isDock && expanded && (
        <div className="fixed inset-0 z-[70] flex flex-col bg-[#0c0b0a] text-white photo-safe-bottom">
          <div className="flex shrink-0 items-center gap-2 border-b border-white/10 px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <button
              type="button"
              onClick={closeSearch}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-2xl text-white/80 active:bg-white/10"
              aria-label="返回相簿"
            >
              ←
            </button>
            <div className="relative min-w-0 flex-1">
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submit(query);
                  if (e.key === 'Escape') closeSearch();
                }}
                placeholder="搜尋相片"
                className="w-full border-0 bg-transparent py-2 text-lg text-white outline-none placeholder:text-white/45"
                autoComplete="off"
                enterKeyHint="search"
                aria-label="搜尋相片"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-0 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white/60"
                  aria-label="清除搜尋文字"
                >
                  ×
                </button>
              )}
            </div>
            <span className="text-xl text-white/55" aria-hidden>
              ⌕
            </span>
          </div>

          <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-10 pt-5">
            {query.trim() ? (
              <div>
                <p className="mb-3 text-xs text-white/45">搜尋結果</p>
                {exactTable != null && (
                  <button
                    type="button"
                    onClick={() => submit(String(exactTable))}
                    className="flex w-full items-center gap-3 border-b border-white/10 py-3 text-left active:bg-white/10"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--photo-accent)]/25 text-sm text-[var(--photo-gold-light)]">
                      {exactTable}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-base text-white/90">
                        {formatTableLabel(exactTable)}
                      </span>
                      <span className="block text-xs text-white/45">查看這桌的全部照片</span>
                    </span>
                  </button>
                )}
                {suggestions.map((guest) => (
                  <button
                    key={guest.id}
                    type="button"
                    onClick={() => submit(guest.name)}
                    className="flex w-full items-center gap-3 border-b border-white/10 py-3 text-left last:border-0 active:bg-white/10"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm text-white/75">
                      {guest.name.slice(0, 1)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-base text-white/90">{guest.name}</span>
                      <span className="block truncate text-xs text-white/45">
                        {formatGuestSubtitle(guest)}
                      </span>
                    </span>
                  </button>
                ))}
                {suggestions.length === 0 && exactTable == null && (
                  <div className="py-12 text-center text-sm text-white/45">
                    找不到相符的姓名或桌號
                  </div>
                )}
              </div>
            ) : (
              <PhotoSearchFilterSections
                featuredGuests={featuredGuests}
                featuredGuestPhotos={featuredGuestPhotos}
                recent={recent}
                onSubmit={submit}
                onSubmitTag={submitTag}
                onSelectTable={selectTable}
              />
            )}
          </div>
        </div>
      )}

      {expanded && !isDock && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => closeSearch()}
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
        {expanded && !isDock && (
          <div
            className={`photo-search-panel overflow-hidden rounded-2xl border border-white/12 p-3 shadow-2xl backdrop-blur-xl ${
              isDock ? 'mb-2' : 'mb-2'
            }`}
          >
            <div className="mb-2 flex items-center justify-between gap-2 px-1">
              <div>
                <p className="text-[13px] font-medium text-white/90">找您的婚禮照片</p>
                <p className="mt-0.5 text-[10px] text-white/45">輸入姓名或桌號，直接找到相關照片</p>
              </div>
              <button
                type="button"
                onClick={closeSearch}
                className="rounded-full px-2 py-1 text-xs text-white/50 active:bg-white/10"
                aria-label="關閉搜尋"
              >
                關閉
              </button>
            </div>
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
                  if (e.key === 'Escape') closeSearch();
                }}
                placeholder="例如：王小明、6"
                className="photo-search-input w-full rounded-xl border border-white/10 bg-black/50 py-3 pl-10 pr-4 text-base text-white placeholder:text-white/35 focus:border-[var(--photo-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--photo-accent)]/40"
                autoComplete="off"
                enterKeyHint="search"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-white/45 active:bg-white/10"
                  aria-label="清除搜尋文字"
                >
                  ×
                </button>
              )}
            </div>
            {(suggestions.length > 0 || exactTable != null) && (
              <div className="mt-2 overflow-hidden rounded-xl border border-white/10 bg-black/25">
                {exactTable != null && (
                  <button
                    type="button"
                    onClick={() => submit(String(exactTable))}
                    className="flex w-full items-center gap-3 border-b border-white/8 px-3 py-2.5 text-left active:bg-white/10"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--photo-accent)]/20 text-sm text-[var(--photo-gold-light)]">
                      {exactTable}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-white/90">
                        {formatTableLabel(exactTable)}
                      </span>
                      <span className="block text-[10px] text-white/45">查看這桌的全部照片</span>
                    </span>
                  </button>
                )}
                {suggestions.map((guest) => (
                  <button
                    key={guest.id}
                    type="button"
                    onClick={() => submit(guest.name)}
                    className="flex w-full items-center gap-3 border-b border-white/8 px-3 py-2.5 text-left last:border-0 active:bg-white/10"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/8 text-xs text-white/65">
                      {guest.name.slice(0, 1)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-white/90">{guest.name}</span>
                      <span className="block truncate text-[10px] text-white/45">
                        {formatGuestSubtitle(guest)}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
            {recent.length > 0 && (
              <div className="mt-2.5">
                <div className="mb-1.5 flex items-center justify-between px-1">
                  <p className="text-[10px] text-white/35">最近搜尋</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {recent.slice(0, 4).map((r) => (
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
            <div className="mt-3 max-h-[42vh] overflow-y-auto pr-1">
              <PhotoSearchFilterSections
                featuredGuests={featuredGuests}
                featuredGuestPhotos={featuredGuestPhotos}
                recent={[]}
                onSubmit={submit}
                onSubmitTag={submitTag}
                onSelectTable={selectTable}
                compact
              />
            </div>
            <button
              type="button"
              onClick={() => submit(query)}
              className="mt-3 w-full rounded-xl bg-gradient-to-r from-[var(--photo-gold-dark)] to-[var(--photo-accent)] py-2.5 text-sm font-medium text-white shadow-lg shadow-[var(--photo-warm-glow)]"
            >
              開始搜尋
            </button>
          </div>
        )}

        {!isDock && showNameScope && onNameScopeChange && (
          <PhotoNameScopeBar
            scope={nameScope}
            onScopeChange={onNameScopeChange}
            guestTable={guestTable}
            compact
          />
        )}

        <div
          className={
            isDock
              ? 'fixed bottom-4 right-4 z-40 photo-safe-bottom'
              : `photo-search-bar flex items-center gap-2 rounded-2xl border px-2 py-1.5 shadow-xl backdrop-blur-xl ${
                  hasFilter ? 'border-[var(--photo-accent)]/35 !bg-[rgba(176,141,85,0.12)]' : ''
                } ${showNameScope ? 'mt-2' : ''}`
          }
        >
          <button
            type="button"
            onClick={openSearch}
            className={
              isDock
                ? 'relative flex h-12 w-12 items-center justify-center rounded-full border border-[var(--photo-accent)]/45 bg-[var(--photo-accent)] text-white shadow-[0_8px_24px_rgba(0,0,0,0.45)] transition active:scale-95'
                : 'flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-2.5 py-2 text-left active:bg-white/5'
            }
            aria-label="搜尋照片"
          >
            <svg className={isDock ? 'h-5 w-5' : 'h-4 w-4'} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
            </svg>
            {!isDock && (
              <div className="min-w-0 flex-1">
                {hasFilter && filterLabel ? (
                  <>
                    <p className="photo-search-primary truncate text-sm font-medium">{filterLabel}</p>
                    {resultCount != null && (
                      <p className="photo-search-secondary text-[10px]">{resultCount} 張照片</p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="photo-search-primary text-sm">搜尋姓名或桌號</p>
                    <p className="photo-search-secondary text-[10px]">點擊輸入，快速找到您的照片</p>
                  </>
                )}
              </div>
            )}
            {isDock && hasFilter && resultCount != null && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-[#0c0b0a] bg-[#d9a85f] px-1 text-[9px] font-medium text-[#20170f]">
                {resultCount > 99 ? '99+' : resultCount}
              </span>
            )}
          </button>
          {!isDock && hasFilter && onShareFilter && (
            <button
              type="button"
              onClick={onShareFilter}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 active:bg-white/10"
              aria-label="分享篩選連結"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          )}
          {!isDock && hasFilter && onDownloadAll && resultCount != null && resultCount > 0 && (
            <button
              type="button"
              onClick={onDownloadAll}
              disabled={downloading}
              className="flex h-9 shrink-0 items-center justify-center gap-1 rounded-xl border border-[var(--photo-accent)]/35 bg-[var(--photo-accent)]/15 px-2.5 text-[11px] font-medium text-[var(--photo-gold-light)] active:bg-[var(--photo-accent)]/25 disabled:opacity-60"
              aria-label={shouldPreferMobilePhotoShare() ? '儲存全部篩選照片到相簿' : '下載全部篩選照片'}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
              </svg>
              {downloading && downloadProgress
                ? `${downloadProgress.done}/${downloadProgress.total}${
                    downloadProgress.parts && downloadProgress.parts > 1
                      ? `·${downloadProgress.part}/${downloadProgress.parts}`
                      : ''
                  }`
                : shouldPreferMobilePhotoShare()
                  ? '儲存'
                  : '下載'}
            </button>
          )}
          {!isDock && hasFilter && onClearFilter && (
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
        </div>
      </div>
    </>
  );
};
