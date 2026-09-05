import React, { useEffect, useState } from 'react';
import type { WeddingPhoto } from '../../types';
import {
  getBlurUrl,
  getGridSrcSet,
  getGridUrl,
  getResponsiveGridWidth,
  GRID_SIZES,
} from '../../utils/photoUrls';

interface PhotoCardProps {
  photo: WeddingPhoto;
  onClick: (photo: WeddingPhoto) => void;
  onTagClick?: (tag: string) => void;
  onNameClick?: (name: string) => void;
  dark?: boolean;
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

  const tableTags = photo.tables.map((t) => `#第${t}桌`);
  const displayTags = [...tableTags, ...photo.tags.slice(0, 2).map((t) => `#${t}`)];
  const displayNames = photo.names.slice(0, 3);
  const overlayNames = photo.names.slice(0, 2).join(' · ');

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
        className="group relative block w-full text-left"
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
          {dark && overlayNames && (
            <p className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent px-2.5 pb-2 pt-8 text-[11px] text-white/85">
              {overlayNames}
            </p>
          )}
        </div>
      </button>

      <div className="space-y-2 p-3">
        {displayNames.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {displayNames.map((name) => (
              <button
                key={name}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onNameClick?.(name);
                }}
                className="rounded-full border border-[var(--photo-accent)]/30 bg-[var(--photo-accent)]/10 px-2 py-0.5 text-[11px] font-medium text-[var(--photo-gold-dark)] hover:bg-[var(--photo-accent)]/20"
              >
                {name}
              </button>
            ))}
            {photo.names.length > 3 && (
              <span className="self-center text-[10px] text-[#2C3E50]/50">
                +{photo.names.length - 3}
              </span>
            )}
          </div>
        )}
        {photo.caption && (
          <p
            className={`line-clamp-2 text-sm leading-relaxed ${
              dark ? 'text-white/75' : 'text-[#2C3E50]'
            }`}
          >
            {photo.caption}
          </p>
        )}
        <div className="flex flex-wrap gap-1.5">
          {displayTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTagClick?.(tag.replace(/^#/, ''));
              }}
              className="rounded-full border border-[#E8E1D5] bg-[#FDFBF7] px-2 py-0.5 text-[11px] text-[var(--photo-accent)] hover:bg-[#E8E1D5]/40"
            >
              {tag.startsWith('#') ? tag : `#${tag}`}
            </button>
          ))}
        </div>
      </div>
    </article>
  );
};
