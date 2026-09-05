import React, { useEffect, useState } from 'react';
import type { WeddingPhoto } from '../../types';
import {
  getBlurUrl,
  getGridSrcSet,
  getGridUrl,
  getResponsiveGridWidth,
  GRID_SIZES,
} from '../../utils/photoUrls';
import { formatTableTag } from '../../utils/tableLabels';

interface PhotoCardProps {
  photo: WeddingPhoto;
  onClick: (photo: WeddingPhoto) => void;
  onTagClick?: (tag: string) => void;
  onNameClick?: (name: string) => void;
  dark?: boolean;
}

const MAX_NAME_CHIPS = 2;
const MAX_TAG_CHIPS = 3;

function chipLabel(items: string[], max: number) {
  const visible = items.slice(0, max);
  const hidden = items.length - visible.length;
  return { visible, hidden };
}

export const PhotoCard: React.FC<PhotoCardProps> = ({
  photo,
  onClick,
  onTagClick,
  onNameClick,
  dark = false,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [gridWidth, setGridWidth] = useState(800);

  useEffect(() => {
    const update = () => setGridWidth(getResponsiveGridWidth(window.innerWidth));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const gridUrl = getGridUrl(photo.publicId, gridWidth);
  const blurUrl = getBlurUrl(photo.publicId);
  const srcSet = getGridSrcSet(photo.publicId);

  const tableTags = photo.tables.map((t) => formatTableTag(t));
  const hashTags = photo.tags.map((t) => `#${t}`);
  const allTags = [...tableTags, ...hashTags];

  const { visible: visibleNames, hidden: hiddenNames } = chipLabel(photo.names, MAX_NAME_CHIPS);
  const { visible: visibleTags, hidden: hiddenTags } = chipLabel(allTags, MAX_TAG_CHIPS);

  const nameChipClass = dark
    ? 'rounded-full border border-[var(--photo-accent)]/35 bg-[var(--photo-accent)]/12 px-2 py-0.5 text-[10px] font-medium text-[var(--photo-gold-light)] hover:bg-[var(--photo-accent)]/22'
    : 'rounded-full border border-[var(--photo-accent)]/30 bg-[var(--photo-accent)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--photo-gold-dark)] hover:bg-[var(--photo-accent)]/20';

  const tagChipClass = dark
    ? 'rounded-full border border-white/12 bg-white/6 px-2 py-0.5 text-[10px] text-white/72 hover:bg-white/10'
    : 'rounded-full border border-[#E8E1D5] bg-[#FDFBF7] px-2 py-0.5 text-[10px] text-[var(--photo-accent)] hover:bg-[#E8E1D5]/40';

  const moreChipClass = dark
    ? 'shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/45'
    : 'shrink-0 rounded-full border border-[#E8E1D5] bg-[#F5F0E8] px-2 py-0.5 text-[10px] text-[#2C3E50]/45';

  const hasMeta = photo.names.length > 0 || allTags.length > 0;

  return (
    <article
      className={`photo-card mb-3 break-inside-avoid overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 hover:shadow-lg ${
        dark
          ? 'border-white/10 bg-white/5 hover:border-white/20 hover:shadow-[var(--photo-accent)]/10'
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
          className={`relative overflow-hidden ${dark ? 'bg-black/30' : 'bg-[#F5F0E8]'} ${
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
        <div className="space-y-1 px-2.5 py-2">
          {photo.names.length > 0 && (
            <div className="flex flex-nowrap items-center gap-1 overflow-hidden">
              {visibleNames.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNameClick?.(name);
                  }}
                  className={`${nameChipClass} max-w-[46%] truncate`}
                >
                  {name}
                </button>
              ))}
              {hiddenNames > 0 && (
                <span className={moreChipClass} title={photo.names.slice(MAX_NAME_CHIPS).join('、')}>
                  +{hiddenNames}
                </span>
              )}
            </div>
          )}

          {allTags.length > 0 && (
            <div className="flex flex-nowrap items-center gap-1 overflow-hidden">
              {visibleTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTagClick?.(tag.replace(/^#/, ''));
                  }}
                  className={`${tagChipClass} max-w-[38%] truncate`}
                >
                  {tag}
                </button>
              ))}
              {hiddenTags > 0 && (
                <span className={moreChipClass} title={allTags.slice(MAX_TAG_CHIPS).join(' ')}>
                  +{hiddenTags}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
};
