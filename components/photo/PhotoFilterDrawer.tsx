import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GuestRecord, PhotoFilter } from '../../types';
import { listTableOptions } from '../../utils/tableLabels';
import {
  EMPTY_FILTER,
  PHOTO_CATEGORIES,
  POPULAR_TAGS,
  filterLabel,
} from '../../utils/photoFilters';
import { GuestAutocomplete } from './GuestAutocomplete';

interface PhotoFilterDrawerProps {
  open: boolean;
  filter: PhotoFilter;
  onChange: (filter: PhotoFilter) => void;
  onClose: () => void;
  resultCount?: number;
}

export const PhotoFilterDrawer: React.FC<PhotoFilterDrawerProps> = ({
  open,
  filter,
  onChange,
  onClose,
  resultCount,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const tableOptions = listTableOptions();

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const handleGuestSelect = (guest: GuestRecord) => {
    onChange({
      ...EMPTY_FILTER,
      name: guest.name,
      query: guest.name,
      nameScope: 'person',
    });
    onClose();
  };

  const applyTag = (tag: string) => {
    onChange({ ...EMPTY_FILTER, tag, query: tag.replace(/^#/, '') });
    onClose();
  };

  const applyTable = (table: number) => {
    onChange({ ...EMPTY_FILTER, table, query: String(table) });
    onClose();
  };

  const applyCategory = (categoryId: string) => {
    onChange({
      ...EMPTY_FILTER,
      category: categoryId === 'all' ? null : categoryId,
    });
    onClose();
  };

  const label = filterLabel(filter);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="搜尋與篩選"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[88dvh] overflow-y-auto rounded-t-3xl bg-[#181818] p-6 text-white photo-safe-bottom"
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />

            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-serif text-lg">找照片</h2>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 hover:bg-white/10"
                aria-label="關閉"
              >
                ✕
              </button>
            </div>

            {label && resultCount != null && (
              <p className="mb-3 text-sm text-white/60">
                {label} · 找到 {resultCount} 張
              </p>
            )}

            <input
              ref={inputRef}
              type="search"
              value={filter.query}
              onChange={(e) => onChange({ ...filter, query: e.target.value })}
              placeholder="輸入姓名、桌號或關係..."
              className="w-full rounded-xl border border-white/10 bg-[#222] px-4 py-3 text-white placeholder:text-white/40 focus:border-[#B08D55] focus:outline-none"
              autoComplete="off"
            />

            <GuestAutocomplete
              query={filter.query}
              onSelect={handleGuestSelect}
              visible={open}
            />

            <div className="mt-6">
              <p className="mb-3 text-xs tracking-wider text-white/50 uppercase">熱門關鍵字</p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => applyTag(tag)}
                    className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <p className="mb-3 text-xs tracking-wider text-white/50 uppercase">快速選桌</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {tableOptions.map(({ table, name }) => (
                  <button
                    key={table}
                    type="button"
                    onClick={() => applyTable(table)}
                    className={`rounded-xl px-2 py-2 text-left ${
                      filter.table === table
                        ? 'bg-[#B08D55] text-white'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <span className="block text-sm font-medium tabular-nums">{table}</span>
                    {name && (
                      <span className="mt-0.5 block truncate text-[10px] text-white/70">{name}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 pb-4">
              <p className="mb-3 text-xs tracking-wider text-white/50 uppercase">活動分類</p>
              <div className="flex flex-col gap-2">
                {PHOTO_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => applyCategory(cat.id)}
                    className={`rounded-xl px-4 py-3 text-left text-sm ${
                      filter.category === cat.id || (cat.id === 'all' && !filter.category)
                        ? 'bg-[#B08D55]/20 text-[#E8D5B5]'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
