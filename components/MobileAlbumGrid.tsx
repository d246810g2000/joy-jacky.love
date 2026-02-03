
import React, { useMemo } from 'react';
import { motion, useTransform } from 'framer-motion';
import type { MotionValue } from 'framer-motion';
import { WEDDING_PHOTOS } from '../constants';
import { Photo } from '../types';
import { getLayoutSequence, partitionPhotosByLayouts, type AlbumLayoutType, type AlbumPage } from '../albumLayouts';

interface MobileAlbumGridProps {
  progress: MotionValue<number>;
  onSelectPhoto: (photo: Photo) => void;
}

// 手機端 8 頁：1 基底 + 7 動態分頁，與滾動淡入淡出同步
const MOBILE_PAGE_COUNT = 8;
const MOBILE_PAGE_TIMING = [
  { start: 0.38, end: 0.48 },
  { start: 0.46, end: 0.56 },
  { start: 0.54, end: 0.64 },
  { start: 0.62, end: 0.72 },
  { start: 0.70, end: 0.80 },
  { start: 0.78, end: 0.88 },
  { start: 0.86, end: 0.96 },
];

export const MobileAlbumGrid: React.FC<MobileAlbumGridProps> = ({ progress, onSelectPhoto }) => {
  const albumPages = useMemo(() => {
    const sequence = getLayoutSequence(MOBILE_PAGE_COUNT);
    return partitionPhotosByLayouts(WEDDING_PHOTOS, sequence);
  }, []);

  const paperBg = "bg-[#F9F7F2]";
  const paperTextureClass = "bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-40";

  return (
    <div className="relative w-[50vw] h-[70vw] max-w-[320px] max-h-[440px] shadow-2xl">
      <div className={`absolute inset-0 ${paperBg} border border-stone-200/50 rounded-r-[2px] overflow-hidden`}>
        <div className={`absolute inset-0 ${paperTextureClass} pointer-events-none`} />
        <PageGrid layout={albumPages[0].layout} photos={albumPages[0].photos} progress={progress} onSelect={onSelectPhoto} pageNum={1} />
      </div>

      {albumPages.slice(1, MOBILE_PAGE_COUNT).map((page, index) => (
        <PageLayer
          key={index}
          page={page}
          progress={progress}
          start={MOBILE_PAGE_TIMING[index].start}
          end={MOBILE_PAGE_TIMING[index].end}
          onSelect={onSelectPhoto}
          pageNum={index + 2}
          paperBg={paperBg}
          paperTextureClass={paperTextureClass}
        />
      ))}
    </div>
  );
};

interface PageLayerProps {
  page: AlbumPage;
  progress: MotionValue<number>;
  start: number;
  end: number;
  onSelect: (photo: Photo) => void;
  pageNum: number;
  paperBg: string;
  paperTextureClass: string;
}

const PageLayer = React.memo(({ page, progress, start, end, onSelect, pageNum, paperBg, paperTextureClass }: PageLayerProps) => {
  const opacity = useTransform(progress, [start - 0.02, start, end, end + 0.02], [0, 1, 1, 0]);

  return (
    <motion.div
      style={{ opacity }}
      className={`absolute inset-0 ${paperBg} border border-stone-200/50 rounded-r-[2px] overflow-hidden`}
    >
      <div className={`absolute inset-0 ${paperTextureClass} pointer-events-none`} />
      <PageGrid layout={page.layout} photos={page.photos} progress={progress} onSelect={onSelect} pageNum={pageNum} />
      <div className="absolute top-0 bottom-0 left-0 w-8 bg-gradient-to-r from-black/5 to-transparent pointer-events-none" />
    </motion.div>
  );
});

interface PageGridProps {
  layout: AlbumLayoutType;
  photos: Photo[];
  progress: MotionValue<number>;
  onSelect: (photo: Photo) => void;
  pageNum: number;
}

const PageGrid = React.memo(({ layout, photos, progress, onSelect, pageNum }: PageGridProps) => {
  const containerPadding = 'p-3 md:p-4';
  const gap = 'gap-2 md:gap-3';

  // 分頁時已依 orientation（publicId h/v）放入對應版面，直接使用傳入順序
  const ordered = photos;

  const gridConfig = (() => {
    switch (layout) {
      case 'single-portrait':
        return { grid: 'grid-cols-1 grid-rows-1', cells: [{ key: 0, col: 1, row: 1 }] };
      case 'two-horizontal':
        return { grid: 'grid-cols-1 grid-rows-2', cells: [{ key: 0, col: 1, row: 1 }, { key: 1, col: 1, row: 1 }] };
      case 'one-h-two-v':
        return {
          grid: 'grid-cols-2 grid-rows-2',
          cells: [{ key: 0, col: 2, row: 1 }, { key: 1, col: 1, row: 1 }, { key: 2, col: 1, row: 1 }],
        };
      case 'four-portrait-grid':
        return {
          grid: 'grid-cols-2 grid-rows-2',
          cells: [{ key: 0, col: 1, row: 1 }, { key: 1, col: 1, row: 1 }, { key: 2, col: 1, row: 1 }, { key: 3, col: 1, row: 1 }],
        };
      default:
        return { grid: 'grid-cols-2 grid-rows-2', cells: [] };
    }
  })();

  return (
    <div className={`absolute inset-0 ${containerPadding} flex flex-col justify-between overflow-hidden`}>
      <div className={`w-full h-full grid ${gridConfig.grid} ${gap}`}>
        {gridConfig.cells.map((cell, i) => {
          const photo = ordered[cell.key];
          if (!photo) return null;
          const spanClass = cell.col === 2 ? 'col-span-2' : cell.row === 2 ? 'row-span-2' : '';
          return (
            <div key={`${photo.id}-${i}`} className={`relative overflow-hidden ${spanClass}`}>
              <PhotoItem photo={photo} index={i} progress={progress} onSelect={onSelect} />
            </div>
          );
        })}
      </div>
      <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none">
        <span className="font-display text-[7px] text-[#b08d55] tracking-[0.3em] opacity-60">
          - {String(pageNum).padStart(2, '0')} -
        </span>
      </div>
    </div>
  );
});

interface PhotoItemProps {
  photo: Photo;
  index: number;
  progress: MotionValue<number>;
  onSelect: (photo: Photo) => void;
}

const PhotoItem = React.memo(({ photo, index, progress, onSelect }: PhotoItemProps) => {
  const direction = index % 2 === 0 ? 1 : -1;
  const range = photo.orientation === 'portrait' ? 5 : 3;
  const parallaxY = useTransform(progress, [0, 1], [`${-range * direction}%`, `${range * direction}%`]);
  const isPortrait = photo.orientation === 'portrait';
  const objectClass = isPortrait
    ? "object-cover object-top"
    : "object-cover object-center";

  return (
    <motion.div 
      onClick={() => onSelect(photo)}
      whileHover={{ scale: 1.01 }}
      className="relative w-full h-full bg-white p-[3px] md:p-[4px] shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(197,160,101,0.15)] cursor-pointer transition-all duration-500 ease-out group"
    >
      <div className="relative w-full h-full overflow-hidden bg-stone-100">
        <motion.img 
          src={photo.compressedUrl ?? photo.url} 
          style={{ y: parallaxY }} 
          className={`absolute inset-0 w-full h-[115%] -top-[7.5%] ${objectClass} opacity-[0.93] hover:opacity-100 transition-opacity duration-500 filter sepia-[0.05] contrast-[1.02]`} 
          alt={photo.alt}
          loading="lazy"
          decoding="async"
        />
        {/* 顆粒覆蓋 */}
        <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none mix-blend-overlay" />
      </div>

      {/* 金色提示點 */}
      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="w-1 h-1 rounded-full bg-[#C5A065]" />
      </div>
    </motion.div>
  );
});
