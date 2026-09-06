import React, { useState } from 'react';
import type { GuestRecord } from '../../types';
import {
  getGuestRelationsForSide,
  PHOTO_SEARCH_SIDES,
  POPULAR_TAGS,
} from '../../utils/photoFilters';
import { listTableOptions } from '../../utils/tableLabels';
import { getFaceAvatarUrl, type FaceBoxNorm } from '../../utils/photoUrls';

interface SearchFilterSectionProps<T> {
  title: string;
  hint?: string;
  previewCount: number;
  expandLabel?: string;
  items: readonly T[];
  gridClassName?: string;
  renderItem: (item: T) => React.ReactNode;
  getKey: (item: T) => string;
}

function SearchFilterSection<T>({
  title,
  hint,
  previewCount,
  expandLabel,
  items,
  gridClassName = 'grid grid-cols-2 gap-1.5',
  renderItem,
  getKey,
}: SearchFilterSectionProps<T>) {
  const [expanded, setExpanded] = useState(false);
  const canExpand = items.length > previewCount;
  const visible = expanded ? items : items.slice(0, previewCount);

  return (
    <section className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.02]">
      <div className="flex items-center justify-between gap-2 border-b border-white/8 px-3 py-2">
        <div className="min-w-0">
          <h2 className="text-sm font-medium text-white/90">{title}</h2>
          {hint && <p className="text-[10px] text-white/40">{hint}</p>}
        </div>
        {canExpand && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="shrink-0 text-xs text-[var(--photo-gold-light)] active:opacity-70"
            aria-expanded={expanded}
          >
            {expanded ? '收合' : expandLabel ?? `展開 ${items.length - previewCount} 項`}
          </button>
        )}
      </div>
      <div className="p-2.5">
        <div className={gridClassName}>{visible.map((item) => renderItem(item))}</div>
      </div>
    </section>
  );
}

interface PhotoSearchFilterSectionsProps {
  featuredGuests: GuestRecord[];
  featuredGuestPhotos?: Record<
    string,
    { publicId: string; face: FaceBoxNorm } | undefined
  >;
  recent: string[];
  onSubmit: (query: string) => void;
  onSubmitTag: (tag: string) => void;
  onSelectTable: (table: number) => void;
  compact?: boolean;
}

export const PhotoSearchFilterSections: React.FC<PhotoSearchFilterSectionsProps> = ({
  featuredGuests,
  featuredGuestPhotos,
  recent,
  onSubmit,
  onSubmitTag,
  onSelectTable,
  compact = false,
}) => {
  const tableOptions = listTableOptions();
  const relationPreview = compact ? 3 : 4;
  const tablePreview = compact ? 6 : 9;
  const tableGrid = compact ? 'grid grid-cols-3 gap-1.5' : 'grid grid-cols-3 sm:grid-cols-4 gap-1.5';

  const selectSideRelation = (side: '男方' | '女方', relation: string) => {
    onSubmitTag(`${side}${relation}`);
  };

  const [avatarFallbacks, setAvatarFallbacks] = useState<Record<string, boolean>>({});

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      {recent.length > 0 && (
        <SearchFilterSection
          title="最近搜尋"
          hint="點一下快速套用"
          previewCount={4}
          items={recent}
          getKey={(item) => item}
          gridClassName="flex flex-wrap gap-1.5"
          renderItem={(item) => (
            <button
              type="button"
              onClick={() => onSubmit(item)}
              className="rounded-full border border-white/12 bg-white/6 px-2.5 py-1.5 text-xs text-white/75 active:bg-white/12"
            >
              {item}
            </button>
          )}
        />
      )}

      <section className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-3">
        <h2 className="mb-3 text-sm font-medium text-white/90">搜尋姓名</h2>
        <div className="flex justify-around gap-4 px-2">
          {featuredGuests.map((guest) => (
            <button
              key={guest.id}
              type="button"
              onClick={() => onSubmit(guest.name)}
              className="flex min-w-0 flex-1 flex-col items-center gap-2"
            >
              {featuredGuestPhotos?.[guest.name] && !avatarFallbacks[guest.name] ? (
                <img
                  src={getFaceAvatarUrl(
                    featuredGuestPhotos[guest.name]!.publicId,
                    320,
                    featuredGuestPhotos[guest.name]!.face
                  )}
                  alt={`${guest.name} 的照片`}
                  className="h-20 w-20 rounded-full border border-white/20 object-cover shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
                  loading="lazy"
                  onError={() =>
                    setAvatarFallbacks((current) => ({ ...current, [guest.name]: true }))
                  }
                />
              ) : (
                <span className="flex h-20 w-20 items-center justify-center rounded-full border border-white/15 bg-gradient-to-br from-[#d5b37a] to-[#604a32] text-2xl text-white">
                  {guest.name.slice(0, 1)}
                </span>
              )}
              <span className="w-full truncate text-center text-sm text-white/80">
                {guest.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {PHOTO_SEARCH_SIDES.map(({ key, label, relationTitle }) => (
        <SearchFilterSection
          key={key}
          title={label}
          hint={relationTitle}
          previewCount={relationPreview}
          expandLabel="更多關係"
          items={getGuestRelationsForSide(key)}
          getKey={(relation) => `${key}-${relation}`}
          renderItem={(relation) => (
            <button
              type="button"
              onClick={() => selectSideRelation(key, relation)}
              className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-2 text-left text-xs text-white/78 active:bg-white/10"
            >
              {relation}
            </button>
          )}
        />
      ))}

      <SearchFilterSection
        title="按桌次篩選"
        hint="共 27 桌"
        previewCount={tablePreview}
        expandLabel="查看全部桌次"
        items={tableOptions}
        getKey={({ table }) => String(table)}
        gridClassName={tableGrid}
        renderItem={({ table, name, label }) => (
          <button
            type="button"
            onClick={() => onSelectTable(table)}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-1.5 py-2 text-left active:bg-white/10"
          >
            <span className="block text-xs font-medium tabular-nums text-[var(--photo-gold-light)]">
              {table}
            </span>
            <span className="mt-0.5 block truncate text-[9px] text-white/50">
              {name || label.replace(/^\d+\s*/, '')}
            </span>
          </button>
        )}
      />

      {POPULAR_TAGS.length > 0 && (
        <section className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5">
          <h2 className="mb-2 text-sm font-medium text-white/90">熱門桌次</h2>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => onSubmitTag(tag.replace(/^#/, ''))}
                className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-white/75 active:bg-white/10"
              >
                {tag}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
