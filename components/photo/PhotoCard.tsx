import React, { useEffect, useState } from 'react';
import type { WeddingPhoto } from '../../types';
import {
  getBlurUrl,
  getGridSrcSet,
  getGridUrl,
  getResponsiveGridWidth,
  GRID_SIZES,
} from '../../utils/photoUrls';
import { formatTableTag, formatTableTagShort } from '../../utils/tableLabels';

interface PhotoCardProps {
  photo: WeddingPhoto;
  onClick: (photo: WeddingPhoto) => void;
  onTagClick?: (tag: string) => void;
  onNameClick?: (name: string) => void;
  dark?: boolean;
  /** 手機精簡：限制 chip 數、桌次縮寫；桌機顯示完整標籤 */
  compact?: boolean;
}

const COMPACT_MAX_NAME_CHIPS = 2;
const COMPACT_MAX_TABLE_CHIPS = 2;

type ExpandedMetaRow = 'names' | 'tables' | null;

function chipLabel<T>(items: T[], max: number | null) {
  if (max == null || items.length <= max) {
    return { visible: items, hidden: 0, hiddenItems: [] as T[] };
  }
  const visible = items.slice(0, max);
  return { visible, hidden: items.length - visible.length, hiddenItems: items.slice(max) };
}

export const PhotoCard: React.FC<PhotoCardProps> = ({
  photo,
  onClick,
  onTagClick,
  onNameClick,
  dark = false,
  compact = false,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [gridWidth, setGridWidth] = useState(800);
  const [expandedRow, setExpandedRow] = useState<ExpandedMetaRow>(null);

  useEffect(() => {
    const update = () => setGridWidth(getResponsiveGridWidth(window.innerWidth));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    setExpandedRow(null);
  }, [photo.id, compact]);

  const gridUrl = getGridUrl(photo.publicId, gridWidth);
  const blurUrl = getBlurUrl(photo.publicId);
  const srcSet = getGridSrcSet(photo.publicId);

  const nameLimit = compact ? COMPACT_MAX_NAME_CHIPS : null;
  const tableLimit = compact ? COMPACT_MAX_TABLE_CHIPS : null;

  const { visible: visibleNames, hidden: hiddenNames, hiddenItems: hiddenNameItems } = chipLabel(
    photo.names,
    nameLimit
  );
  const { visible: visibleTables, hiddenItems: hiddenTableNumbers } = chipLabel(
    photo.tables,
    tableLimit
  );

  const formatTableChip = compact ? formatTableTagShort : formatTableTag;

  const tableExpandItems = hiddenTableNumbers.map((table) => ({
    key: `table-${table}`,
    label: formatTableTag(table),
    filterValue: formatTableTag(table).replace(/^#/, ''),
  }));
  const tableRowMoreCount = tableExpandItems.length;

  const toggleExpandedRow = (row: Exclude<ExpandedMetaRow, null>) => {
    setExpandedRow((current) => (current === row ? null : row));
  };

  const nameChipClass = dark
    ? 'rounded-full border border-[var(--photo-accent)]/35 bg-[var(--photo-accent)]/12 px-2 py-0.5 text-[10px] font-medium text-[var(--photo-gold-light)] hover:bg-[var(--photo-accent)]/22'
    : 'rounded-full border border-[var(--photo-accent)]/30 bg-[var(--photo-accent)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--photo-gold-dark)] hover:bg-[var(--photo-accent)]/20';

  const tagChipClass = dark
    ? 'rounded-full border border-white/12 bg-white/6 px-2 py-0.5 text-[10px] text-white/72 hover:bg-white/10'
    : 'rounded-full border border-[#E8E1D5] bg-[#FDFBF7] px-2 py-0.5 text-[10px] text-[var(--photo-accent)] hover:bg-[#E8E1D5]/40';

  const moreChipClass = dark
    ? 'shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/55 transition active:scale-95 active:bg-white/10 hover:bg-white/10'
    : 'shrink-0 rounded-full border border-[#E8E1D5] bg-[#F5F0E8] px-2 py-0.5 text-[10px] text-[#2C3E50]/55 transition active:scale-95 active:bg-[#E8E1D5]/60 hover:bg-[#E8E1D5]/60';

  const chipRowClass = compact
    ? 'flex min-w-0 flex-nowrap items-center gap-1 overflow-hidden'
    : 'flex min-w-0 flex-wrap items-center gap-1.5';

  const hasMeta = photo.names.length > 0 || photo.tables.length > 0;
  const namesExpanded = !compact || expandedRow === 'names';
  const tablesExpanded = !compact || expandedRow === 'tables';

  return (
    <article
      className={`photo-card mb-3 break-inside-avoid overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 ${
        dark
          ? 'photo-card--dark border-white/10 bg-white/5'
          : 'border-[#E8E1D5] bg-white hover:shadow-md'
      }`}
      style={{ contentVisibility: 'auto', containIntrinsicSize: '0 280px' }}
    >
      <button
        type="button"
        onClick={() => onClick(photo)}
        className="group relative block w-full touch-manipulation text-left outline-none transition-transform active:scale-[0.985] focus-visible:ring-2 focus-visible:ring-[var(--photo-gold-light)] focus-visible:ring-inset"
        aria-label={`查看照片${photo.names.length ? `：${photo.names.join('、')}` : ''}`}
      >
        <div
          className={`photo-card-media relative overflow-hidden ${dark ? 'bg-black/30' : 'bg-[#F5F0E8]'} ${
            photo.orientation === 'landscape' ? 'aspect-[4/3]' : 'aspect-[3/4]'
          }`}
        >
          {!loaded && <div className="photo-skeleton absolute inset-0" aria-hidden />}
          <img
            src={loaded ? gridUrl : blurUrl}
            srcSet={loaded ? srcSet : undefined}
            sizes={loaded ? GRID_SIZES : undefined}
            alt={photo.caption || photo.names.join('、') || '婚禮照片'}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            className={`h-full w-full object-cover transition-all duration-500 ${
              loaded ? 'scale-100 opacity-100 blur-0' : 'scale-105 opacity-80 blur-sm'
            }`}
          />
          {loaded && dark && <div className="photo-card-vignette pointer-events-none" aria-hidden />}
          <span className="photo-time-badge absolute right-2 top-2 font-mono text-[11px] tabular-nums">
            {photo.time}
          </span>
        </div>
      </button>

      {hasMeta && (
        <div className={`space-y-1 px-2.5 py-2 ${compact ? '' : 'md:space-y-1.5 md:px-3'}`}>
          {photo.names.length > 0 && (
            <div className={namesExpanded ? 'flex min-w-0 flex-wrap items-center gap-1.5' : chipRowClass}>
              {visibleNames.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNameClick?.(name);
                  }}
                  className={`${nameChipClass} ${compact ? 'max-w-[46%] truncate' : 'max-w-full'}`}
                >
                  {name}
                </button>
              ))}
              {expandedRow === 'names' &&
                hiddenNameItems.map((name) => (
                  <button
                    key={`more-${name}`}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNameClick?.(name);
                      setExpandedRow(null);
                    }}
                    className={`${nameChipClass} max-w-full truncate`}
                  >
                    {name}
                  </button>
                ))}
              {compact && hiddenNames > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpandedRow('names');
                  }}
                  className={moreChipClass}
                  aria-expanded={expandedRow === 'names'}
                  aria-label={
                    expandedRow === 'names'
                      ? '收合更多姓名'
                      : `展開 ${hiddenNames} 個更多姓名`
                  }
                >
                  {expandedRow === 'names' ? '−' : `+${hiddenNames}`}
                </button>
              )}
            </div>
          )}

          {photo.tables.length > 0 && (
            <div className={tablesExpanded ? 'flex min-w-0 flex-wrap items-center gap-1.5' : chipRowClass}>
              {visibleTables.map((table) => (
                <button
                  key={table}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTagClick?.(formatTableTag(table).replace(/^#/, ''));
                  }}
                  className={`${tagChipClass} ${compact ? 'shrink-0 tabular-nums' : 'max-w-full text-left'}`}
                  title={formatTableTag(table)}
                >
                  {formatTableChip(table)}
                </button>
              ))}
              {expandedRow === 'tables' &&
                tableExpandItems.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTagClick?.(item.filterValue);
                      setExpandedRow(null);
                    }}
                    className={`${tagChipClass} max-w-full truncate`}
                  >
                    {item.label}
                  </button>
                ))}
              {compact && tableRowMoreCount > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpandedRow('tables');
                  }}
                  className={moreChipClass}
                  aria-expanded={expandedRow === 'tables'}
                  aria-label={
                    expandedRow === 'tables'
                      ? '收合更多桌次'
                      : `展開 ${tableRowMoreCount} 個更多桌次`
                  }
                >
                  {expandedRow === 'tables' ? '−' : `+${tableRowMoreCount}`}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
};
