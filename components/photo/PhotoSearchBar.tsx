import React, { useEffect, useRef, useState } from 'react';
import { addRecentSearch, getRecentSearches } from '../../utils/photoRecentSearch';

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
            className={`overflow-hidden rounded-2xl border border-white/10 bg-[#1a1816]/95 p-3 shadow-2xl backdrop-blur-xl ${
              isDock ? 'mb-2' : 'mb-2'
            }`}
          >
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit(query);
                if (e.key === 'Escape') setExpanded(false);
              }}
              placeholder="輸入姓名或桌號..."
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-base text-white placeholder:text-white/40 focus:border-[#B08D55] focus:outline-none"
              autoComplete="off"
              enterKeyHint="search"
            />
            {recent.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {recent.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => submit(r)}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70"
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => submit(query)}
              className="mt-3 w-full rounded-xl bg-[#B08D55] py-2.5 text-sm font-medium text-white"
            >
              搜尋
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 rounded-full border border-white/15 bg-[#1a1816]/90 px-3 py-2 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-full px-3 py-2.5 text-left text-sm active:bg-white/5"
          >
            <span aria-hidden>🔍</span>
            {hasFilter && filterLabel ? (
              <span className="truncate font-medium text-white/90">{filterLabel}</span>
            ) : (
              <span className="truncate text-white/45">輸入姓名、桌號...</span>
            )}
          </button>
          {hasFilter && onClearFilter && (
            <button
              type="button"
              onClick={onClearFilter}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/50 active:bg-white/10"
              aria-label="清除篩選"
            >
              ✕
            </button>
          )}
          <button
            type="button"
            onClick={onOpenDrawer}
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg active:bg-white/10"
            aria-label="進階篩選"
          >
            ⚙️
            {hasFilter && resultCount != null && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#B08D55] px-1 text-[10px] text-white">
                {resultCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </>
  );
};
