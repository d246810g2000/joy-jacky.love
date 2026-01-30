
import React, { useMemo } from 'react';
import { motion, useTransform } from 'framer-motion';
import type { MotionValue } from 'framer-motion';
import { WEDDING_PHOTOS } from '../constants';
import { Photo } from '../types';

interface MobileAlbumGridProps {
  progress: MotionValue<number>;
  onSelectPhoto: (photo: Photo) => void;
}

export const MobileAlbumGrid: React.FC<MobileAlbumGridProps> = ({ progress, onSelectPhoto }) => {
  // 手機端：分頁時機與照片飛出動畫同步 (wave triggers: 0.40, 0.48, 0.56, 0.64, 0.72)
  // 每頁稍微提前 0.02 開始淡入，這樣照片飛出時剛好能看到頁面
  const pages = useMemo(() => [
    { photos: WEDDING_PHOTOS.slice(4, 8), start: 0.38, end: 0.48, layout: 'grid' as const },
    { photos: WEDDING_PHOTOS.slice(8, 12), start: 0.46, end: 0.56, layout: 'editorial' as const },
    { photos: WEDDING_PHOTOS.slice(0, 4), start: 0.54, end: 0.64, layout: 'grid' as const },
    { photos: WEDDING_PHOTOS.slice(4, 8), start: 0.62, end: 0.72, layout: 'editorial' as const },
    { photos: WEDDING_PHOTOS.slice(8, 12), start: 0.70, end: 0.80, layout: 'grid' as const },
    { photos: WEDDING_PHOTOS.slice(12, 16), start: 0.78, end: 0.88, layout: 'editorial' as const },
    { photos: WEDDING_PHOTOS.slice(16, 20), start: 0.86, end: 0.96, layout: 'grid' as const },
  ], []);

  // 紙張質感和配色
  const paperBg = "bg-[#F9F7F2]";
  const paperTextureClass = "bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-40";

  return (
    <div className="relative w-[50vw] h-[70vw] max-w-[320px] max-h-[440px] shadow-2xl">
      {/* 基底頁面 - 始終可見 */}
      <div className={`absolute inset-0 ${paperBg} border border-stone-200/50 rounded-r-[2px] overflow-hidden`}>
        <div className={`absolute inset-0 ${paperTextureClass} pointer-events-none`} />
        <PageGrid photos={WEDDING_PHOTOS.slice(0, 4)} progress={progress} onSelect={onSelectPhoto} layout="editorial" pageNum={1} />
      </div>

      {/* 動態分頁 - 隨滾動逐頁顯示 */}
      {pages.map((page, index) => (
        <PageLayer
          key={index}
          photos={page.photos}
          progress={progress}
          start={page.start}
          end={page.end}
          onSelect={onSelectPhoto}
          layout={page.layout}
          pageNum={index + 2}
          paperBg={paperBg}
          paperTextureClass={paperTextureClass}
        />
      ))}
    </div>
  );
};

interface PageLayerProps {
  photos: Photo[];
  progress: MotionValue<number>;
  start: number;
  end: number;
  onSelect: (photo: Photo) => void;
  layout: 'grid' | 'editorial';
  pageNum: number;
  paperBg: string;
  paperTextureClass: string;
}

const PageLayer = React.memo(({ photos, progress, start, end, onSelect, layout, pageNum, paperBg, paperTextureClass }: PageLayerProps) => {
  // 純 2D 變換：只用淡入淡出，不要上下移動，讓目光專注在飛出的照片上
  const opacity = useTransform(progress, [start - 0.02, start, end, end + 0.02], [0, 1, 1, 0]);

  return (
    <motion.div
      style={{ opacity }}
      className={`absolute inset-0 ${paperBg} border border-stone-200/50 rounded-r-[2px] overflow-hidden`}
    >
      <div className={`absolute inset-0 ${paperTextureClass} pointer-events-none`} />
      <PageGrid photos={photos} progress={progress} onSelect={onSelect} layout={layout} pageNum={pageNum} />
      
      {/* 書脊陰影 */}
      <div className="absolute top-0 bottom-0 left-0 w-8 bg-gradient-to-r from-black/5 to-transparent pointer-events-none" />
    </motion.div>
  );
});

interface PageGridProps {
  photos: Photo[];
  progress: MotionValue<number>;
  onSelect: (photo: Photo) => void;
  layout: 'grid' | 'editorial';
  pageNum: number;
}

const PageGrid = React.memo(({ photos, progress, onSelect, layout, pageNum }: PageGridProps) => {
  const containerPadding = layout === 'editorial' ? 'p-4 md:p-5' : 'p-3 md:p-4';
  // editorial：大格放橫向(h)、小格放直向(v)，依 orientation 排序讓版面更協調
  const ordered = layout === 'editorial'
    ? [...photos.slice(0, 4)].sort((a, b) =>
        (a.orientation === 'landscape' ? -1 : 1) - (b.orientation === 'landscape' ? -1 : 1)
      )
    : photos.slice(0, 4);

  return (
    <div className={`absolute inset-0 ${containerPadding} flex flex-col justify-between overflow-hidden`}>
      <div className={`w-full h-full grid ${layout === 'editorial' ? 'grid-cols-2 grid-rows-3' : 'grid-cols-2 grid-rows-2'} gap-3`}>
        {ordered.map((photo, i) => {
          let classes = "relative overflow-hidden";
          
          if (layout === 'editorial') {
            if (i === 0) classes += " col-span-2 row-span-2";
            else if (i === 1) classes += " col-span-1 row-span-1";
            else if (i === 2) classes += " col-span-1 row-span-1";
            else classes += " hidden";
          } else {
            classes += " col-span-1 row-span-1";
          }

          return (
            <div key={photo.id} className={classes}>
              <PhotoItem photo={photo} index={i} progress={progress} onSelect={onSelect} />
            </div>
          );
        })}
      </div>
      
      {/* 優雅的頁碼 */}
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
          src={photo.url} 
          style={{ y: parallaxY }} 
          className={`absolute inset-0 w-full h-[115%] -top-[7.5%] ${objectClass} opacity-[0.93] hover:opacity-100 transition-opacity duration-500 filter sepia-[0.05] contrast-[1.02]`} 
          alt={photo.alt} 
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
