
import React, { useMemo } from 'react';
import { motion, useTransform, useMotionValue } from 'framer-motion';
import type { MotionValue } from 'framer-motion';
import { WEDDING_PHOTOS } from '../constants';
import { Photo } from '../types';
import { MobileAlbumGrid } from './MobileAlbumGrid';
import { getLayoutSequence, partitionPhotosByLayouts, type AlbumLayoutType, type AlbumPage } from '../albumLayouts';

interface BookCoverProps {
  progress: MotionValue<number>;
  onSelectPhoto: (photo: Photo) => void;
  isMobile: boolean;
}

export const BookCover: React.FC<BookCoverProps> = ({ progress, onSelectPhoto, isMobile }) => {
  // 手機和電腦端都使用靜態 PNG 封面圖片
  // 封面不淡化，始終顯示
  const contentOpacity = useTransform(progress, [0.25, 0.35], [0, 1]);
  
  // 封面翻轉動畫（手機和電腦端共用）
  const coverRotateY = useTransform(progress, [0.25, 0.35], [0, -180]);
  
  // 手機端：封面翻轉後向右平移，讓相簿內容置中
  // 平移距離約為相簿寬度的 25-30%，確保翻轉後相簿內容置中
  const mobileCoverTranslateX = useTransform(progress, [0.25, 0.35], [0, 80]);
  
  if (isMobile) {
    return (
      <motion.div className="relative w-[50vw] h-[70vw] max-w-[320px] max-h-[440px]">
        {/* 相簿內容（在封面下方顯示，跟著封面一起平移） */}
        <motion.div
          style={{ 
            opacity: contentOpacity,
            x: mobileCoverTranslateX
          }}
          className="absolute inset-0"
        >
          <MobileAlbumGrid progress={progress} onSelectPhoto={onSelectPhoto} />
        </motion.div>
        
        {/* 靜態 PNG 封面 - 翻轉到左邊並向右平移，讓相簿置中 */}
        <motion.div
          style={{ 
            rotateY: coverRotateY,
            x: mobileCoverTranslateX,
            transformStyle: 'preserve-3d',
            transformOrigin: 'left',
            zIndex: 10
          }}
          className="absolute inset-0"
        >
          {/* 封面正面 */}
          <div className="absolute inset-0 rounded-r-[2px] overflow-hidden shadow-2xl" style={{ backfaceVisibility: 'hidden' }}>
            <img
              src={`${import.meta.env.BASE_URL}book-cover.png`}
              alt="Wedding Album Cover"
              className="w-full h-full object-contain"
              style={{ pointerEvents: 'none' }}
              onError={(e) => {
                console.error('Failed to load cover image:', e.currentTarget.src);
              }}
            />
          </div>
          
          {/* 封面背面（翻轉後顯示） */}
          <div 
            className="absolute inset-0 bg-[#F9F7F2] rounded-r-[2px] overflow-hidden border-r border-stone-200 shadow-inner" 
            style={{ 
              transform: 'rotateY(180deg) translateZ(1px)', 
              backfaceVisibility: 'hidden' 
            }}
          >
            {/* 透出封面正面顏色 - 半透明封面圖片作為背景層，添加輕微模糊效果 */}
            <div className="absolute inset-0 opacity-[0.15] mix-blend-multiply blur-sm">
              <img
                src={`${import.meta.env.BASE_URL}book-cover.png`}
                alt=""
                className="w-full h-full object-cover"
                style={{ pointerEvents: 'none', transform: 'scaleX(-1)' }}
              />
            </div>
            
            {/* Paper Texture */}
            <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]" />
            
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 md:p-12 text-center z-10">
              <p className="font-serif italic text-lg md:text-2xl lg:text-3xl text-[#1a1d23]/80 mb-3 md:mb-4 leading-relaxed px-4">"我們的愛情故事，<br/>從這裡開始"</p>
              <div className="w-8 md:w-12 h-[1px] bg-[#C5A065] opacity-50 mb-3 md:mb-4" />
              <p className="font-display text-[8px] md:text-[9px] text-[#888] tracking-widest uppercase leading-relaxed px-4">
                記錄我們<br/>
                最美好的瞬間
              </p>
            </div>
            
            {/* Bookplate */}
            <div className="absolute bottom-4 md:bottom-6 left-0 right-0 flex justify-center opacity-60">
              <div className="border border-[#dcdcdc] px-3 md:px-4 py-1">
                <span className="font-mono text-[7px] md:text-[8px] text-[#aaa] uppercase tracking-widest">Ex Libris</span>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // 桌面端：使用靜態 PNG 封面 + 3D 翻書效果（內頁）
  // Enhanced rotation physics for a heavier, more realistic book feel
  const bookRotateX = useTransform(progress, [0, 0.25, 0.7], isMobile ? [0, 0, 0] : [0, 10, 55]); 
  const bookRotateZ = useTransform(progress, [0, 0.25, 0.9], isMobile ? [0, 0, 0] : [0, 2, 25]);
  const bookRotateY = useTransform(progress, [0, 0.25, 0.7], isMobile ? [0, 0, 0] : [0, 0, 15]);
  
  // Cover opens faster to avoid overlapping with first page
  // 封面需要在第一頁開始翻轉之前完成，避免超過內頁
  // coverRotateY 已在函數開頭定義（手機和電腦端共用）
  const coverScaleX = useTransform(progress, [0.25, 0.35], [1, 1]);
  const coverSkewY = useTransform(progress, [0.25, 0.35], [0, 0]);
  // 封面不淡化，始終顯示（opacity 固定為 1）
  
  // Staggered page turns with more organic, non-uniform variation
  // Mobile: Sequential Fade-to-Zero. Each page disappears to reveal the one beneath.
  const getPageScaleX = (start: number, end: number) => 
    useTransform(progress, [start, end], [1, 1]);
  const getPageSkewY = (start: number, end: number) => 
    useTransform(progress, [start, end], [0, 0]);
  const getPageOpacity = (start: number, end: number) => {
    if (!isMobile) return useTransform(progress, [start, end], [1, 1]);
    // Mobile: Sharp fade-out to zero so the next layer is perfectly clear
    return useTransform(progress, [start, end], [1, 0]);
  }

  const page1RotateY = useTransform(progress, [0.35, 0.43], isMobile ? [0, 0] : [0, -179]);
  const page1ScaleX = getPageScaleX(0.35, 0.43);
  const page1SkewY = getPageSkewY(0.35, 0.43);
  const page1Opacity = getPageOpacity(0.35, 0.43);

  const page2RotateY = useTransform(progress, [0.43, 0.51], isMobile ? [0, 0] : [0, -177]);
  const page2ScaleX = getPageScaleX(0.43, 0.51);
  const page2SkewY = getPageSkewY(0.43, 0.51);
  const page2Opacity = getPageOpacity(0.43, 0.51);

  const page3RotateY = useTransform(progress, [0.51, 0.59], isMobile ? [0, 0] : [0, -174]);
  const page3ScaleX = getPageScaleX(0.51, 0.59);
  const page3SkewY = getPageSkewY(0.51, 0.59);
  const page3Opacity = getPageOpacity(0.51, 0.59);

  const page4RotateY = useTransform(progress, [0.59, 0.67], isMobile ? [0, 0] : [0, -170]);
  const page4ScaleX = getPageScaleX(0.59, 0.67);
  const page4SkewY = getPageSkewY(0.59, 0.67);
  const page4Opacity = getPageOpacity(0.59, 0.67);

  const page5RotateY = useTransform(progress, [0.67, 0.75], isMobile ? [0, 0] : [0, -165]);
  const page5ScaleX = getPageScaleX(0.67, 0.75);
  const page5SkewY = getPageSkewY(0.67, 0.75);
  const page5Opacity = getPageOpacity(0.67, 0.75);

  const page6RotateY = useTransform(progress, [0.75, 0.83], isMobile ? [0, 0] : [0, -159]);
  const page6ScaleX = getPageScaleX(0.75, 0.83);
  const page6SkewY = getPageSkewY(0.75, 0.83);
  const page6Opacity = getPageOpacity(0.75, 0.83);

  const page7RotateY = useTransform(progress, [0.83, 0.91], isMobile ? [0, 0] : [0, -152]);
  const page7ScaleX = getPageScaleX(0.83, 0.91);
  const page7SkewY = getPageSkewY(0.83, 0.91);
  const page7Opacity = getPageOpacity(0.83, 0.91);

  const shadowOpacity = useTransform(progress, [0.25, 0.6], [0, 0.3]);

  // 四種版面隨機穿插：1 張直式 / 2 張橫式上下 / 上 1 橫下 2 直左右 / 4 張直式格狀
  const slices = useMemo(() => {
    const sequence = getLayoutSequence(15);
    const albumPages = partitionPhotosByLayouts(WEDDING_PHOTOS, sequence);
    return {
      base: albumPages[0],
      p1: albumPages[1],
      p1B: albumPages[2],
      p2: albumPages[3],
      p2B: albumPages[4],
      p3: albumPages[5],
      p3B: albumPages[6],
      p4: albumPages[7],
      p4B: albumPages[8],
      p5: albumPages[9],
      p5B: albumPages[10],
      p6: albumPages[11],
      p6B: albumPages[12],
      p7: albumPages[13],
      p7B: albumPages[14],
    };
  }, []);

  // Elegant paper texture (Warm Linen)
  const paperBg = "bg-[#F9F7F2]"; // Warm cream/off-white
  const paperTexture = "repeating-linear-gradient(90deg, #F9F7F2, #F9F7F2 2px, #EBE8E0 3px, #EBE8E0 3px)";
  
  return (
    <motion.div
      style={{ 
        rotateX: bookRotateX,
        rotateZ: bookRotateZ,
        rotateY: bookRotateY,
        transformStyle: isMobile ? 'flat' : 'preserve-3d',
      }}
      // Added transform-gpu to ensure hardware acceleration
      className={`relative w-[50vw] h-[70vw] max-w-[320px] max-h-[440px] shadow-2xl ${isMobile ? '' : 'transform-gpu'}`}
    >
      <div className="absolute inset-0" style={{ transformStyle: isMobile ? 'flat' : 'preserve-3d' }}>
        {/* Book Spine / Back Cover Base */}
        <div className="absolute inset-0 bg-[#1e293b] rounded-[2px] shadow-2xl" style={{ transform: isMobile ? 'none' : 'translateZ(-16px)', backfaceVisibility: 'hidden' }} />
        
      {/* Pages Block */}
      <div className="absolute inset-0" style={{ transformStyle: isMobile ? 'flat' : 'preserve-3d' }}>
         {/* Page Thickness Effect (Hidden on mobile) */}
         {!isMobile && (
            <>
              <div className="absolute top-[2px] right-0 bottom-[2px] w-[16px] origin-right" style={{ background: paperTexture, transform: 'rotateY(-90deg)' }} />
              <div className="absolute bottom-0 left-[2px] right-0 h-[16px] origin-bottom" style={{ background: "#EBE8E0", transform: 'rotateX(-90deg)' }} />
              <div className="absolute top-0 left-[2px] right-0 h-[16px] origin-top" style={{ background: "#EBE8E0", transform: 'rotateX(90deg)' }} />
            </>
         )}
         
         {/* Static Base Page (Always visible on mobile to show content after cover slides) */}
         <div className={`absolute inset-0 ${paperBg} border border-stone-200/50`} style={{ transform: isMobile ? 'none' : 'translateZ(0px)' }}>
            <PhotoGrid layout={slices.base.layout} photos={slices.base.photos} progress={progress} onSelect={onSelectPhoto} pageNum={1} />
         </div>
      </div>
    </div>

      {!isMobile && (
        <>
          <FanPage rotateY={page7RotateY} index={1} opacity={shadowOpacity} frontPage={slices.p7} backPage={slices.p7B} progress={progress} onSelect={onSelectPhoto} pageNum={14} isMobile={isMobile} />
          <FanPage rotateY={page6RotateY} index={2} opacity={shadowOpacity} frontPage={slices.p6} backPage={slices.p6B} progress={progress} onSelect={onSelectPhoto} pageNum={12} isMobile={isMobile} />
          <FanPage rotateY={page5RotateY} index={3} opacity={shadowOpacity} frontPage={slices.p5} backPage={slices.p5B} progress={progress} onSelect={onSelectPhoto} pageNum={10} isMobile={isMobile} />
          <FanPage rotateY={page4RotateY} index={4} opacity={shadowOpacity} frontPage={slices.p4} backPage={slices.p4B} progress={progress} onSelect={onSelectPhoto} pageNum={8} isMobile={isMobile} />
          <FanPage rotateY={page3RotateY} index={5} opacity={shadowOpacity} frontPage={slices.p3} backPage={slices.p3B} progress={progress} onSelect={onSelectPhoto} pageNum={6} isMobile={isMobile} />
          <FanPage rotateY={page2RotateY} index={6} opacity={shadowOpacity} frontPage={slices.p2} backPage={slices.p2B} progress={progress} onSelect={onSelectPhoto} pageNum={4} isMobile={isMobile} />
          <FanPage rotateY={page1RotateY} index={7} opacity={shadowOpacity} frontPage={slices.p1} backPage={slices.p1B} progress={progress} onSelect={onSelectPhoto} pageNum={2} isMobile={isMobile} />
        </>
      )}

      {isMobile && (
        <>
          <FanPage rotateY={page7RotateY} scaleX={page7ScaleX} skewY={page7SkewY} opacityValue={page7Opacity} index={1} opacity={shadowOpacity} frontPage={slices.p7} backPage={slices.p7B} progress={progress} onSelect={onSelectPhoto} pageNum={14} isMobile={isMobile} />
          <FanPage rotateY={page6RotateY} scaleX={page6ScaleX} skewY={page6SkewY} opacityValue={page6Opacity} index={2} opacity={shadowOpacity} frontPage={slices.p6} backPage={slices.p6B} progress={progress} onSelect={onSelectPhoto} pageNum={12} isMobile={isMobile} />
          <FanPage rotateY={page5RotateY} scaleX={page5ScaleX} skewY={page5SkewY} opacityValue={page5Opacity} index={3} opacity={shadowOpacity} frontPage={slices.p5} backPage={slices.p5B} progress={progress} onSelect={onSelectPhoto} pageNum={10} isMobile={isMobile} />
          <FanPage rotateY={page4RotateY} scaleX={page4ScaleX} skewY={page4SkewY} opacityValue={page4Opacity} index={4} opacity={shadowOpacity} frontPage={slices.p4} backPage={slices.p4B} progress={progress} onSelect={onSelectPhoto} pageNum={8} isMobile={isMobile} />
          <FanPage rotateY={page3RotateY} scaleX={page3ScaleX} skewY={page3SkewY} opacityValue={page3Opacity} index={5} opacity={shadowOpacity} frontPage={slices.p3} backPage={slices.p3B} progress={progress} onSelect={onSelectPhoto} pageNum={6} isMobile={isMobile} />
          <FanPage rotateY={page2RotateY} scaleX={page2ScaleX} skewY={page2SkewY} opacityValue={page2Opacity} index={6} opacity={shadowOpacity} frontPage={slices.p2} backPage={slices.p2B} progress={progress} onSelect={onSelectPhoto} pageNum={4} isMobile={isMobile} />
          <FanPage rotateY={page1RotateY} scaleX={page1ScaleX} skewY={page1SkewY} opacityValue={page1Opacity} index={7} opacity={shadowOpacity} frontPage={slices.p1} backPage={slices.p1B} progress={progress} onSelect={onSelectPhoto} pageNum={2} isMobile={isMobile} />
        </>
      )}

      {/* --- FRONT COVER DESIGN (Static PNG) --- */}
      <motion.div
        style={{ 
          rotateY: coverRotateY, 
          scaleX: coverScaleX,
          skewY: coverSkewY,
          opacity: 1, // 封面不淡化，始終顯示
          transformStyle: 'preserve-3d', 
          transformOrigin: 'left', 
          zIndex: 50 
        }}
        className="absolute inset-0"
      >
        {/* Outer Front Cover - Static PNG */}
        <div className="absolute inset-0 rounded-r-[2px] overflow-hidden shadow-2xl" style={{ backfaceVisibility: 'hidden' }}>
          <img
            src={`${import.meta.env.BASE_URL}book-cover.png`}
            alt="Wedding Album Cover"
            className="w-full h-full object-cover"
            style={{ pointerEvents: 'none' }}
            onError={(e) => {
              console.error('Failed to load cover image:', e.currentTarget.src);
            }}
          />
        </div>

        {/* Inner Left Cover (Inside of the hard cover) */}
        <div className="absolute inset-0 bg-[#F9F7F2] rounded-r-[2px] overflow-hidden border-r border-stone-200 shadow-inner" style={{ transform: 'rotateY(180deg) translateZ(1px)', backfaceVisibility: 'hidden' }}>
           {/* 透出封面正面顏色 - 半透明封面圖片作為背景層，添加輕微模糊效果 */}
           <div className="absolute inset-0 opacity-[0.15] mix-blend-multiply blur-sm">
             <img
               src={`${import.meta.env.BASE_URL}book-cover.png`}
               alt=""
               className="w-full h-full object-cover"
               style={{ pointerEvents: 'none', transform: 'scaleX(-1)' }}
             />
           </div>
           
           {/* Paper Texture */}
           <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]" />
           
           <div className="absolute inset-0 flex flex-col items-center justify-center p-6 md:p-12 text-center z-10">
              <p className="font-serif italic text-lg md:text-2xl lg:text-3xl text-[#1a1d23]/80 mb-3 md:mb-4 leading-relaxed px-4">"我們的愛情故事，<br/>從這裡開始"</p>
              <div className="w-8 md:w-12 h-[1px] bg-[#C5A065] opacity-50 mb-3 md:mb-4" />
              <p className="font-display text-[8px] md:text-[9px] text-[#888] tracking-widest uppercase leading-relaxed px-4">
                記錄我們<br/>
                最美好的瞬間
              </p>
           </div>
           
           {/* Bookplate */}
           <div className="absolute bottom-6 left-0 right-0 flex justify-center opacity-60">
             <div className="border border-[#dcdcdc] px-4 py-1">
               <span className="font-mono text-[8px] text-[#aaa] uppercase tracking-widest">Ex Libris</span>
             </div>
           </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

interface FanPageProps {
  rotateY: MotionValue<number>;
  scaleX?: MotionValue<number>;
  skewY?: MotionValue<number>;
  opacityValue?: MotionValue<number>;
  index: number;
  opacity: MotionValue<number>;
  frontPage: AlbumPage;
  backPage: AlbumPage;
  progress: MotionValue<number>;
  onSelect: (photo: Photo) => void;
  pageNum: number;
  isMobile: boolean;
}

const FanPage = React.memo(({ rotateY, scaleX, skewY, opacityValue, index, opacity, frontPage, backPage, progress, onSelect, pageNum, isMobile }: FanPageProps) => {
  const x = useMotionValue(0);
  const dragRotateY = useTransform(x, [-100, 100], [-35, 35]);
  const combinedRotateY = useTransform([rotateY, dragRotateY], ([s, d]: any) => s + d);
  const dragEnabled = !isMobile;

  const paperClass = "bg-[#F9F7F2]";
  const paperTextureClass = "bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-40";

  return (
    <motion.div
      drag={dragEnabled ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      style={{ 
        rotateY: isMobile ? 0 : combinedRotateY, 
        scaleX: isMobile && scaleX ? scaleX : 1,
        skewY: isMobile && skewY ? skewY : 0,
        opacity: isMobile && opacityValue ? opacityValue : 1,
        x, 
        transformStyle: isMobile ? 'flat' : 'preserve-3d', 
        transformOrigin: 'left', 
        zIndex: index, 
        cursor: dragEnabled ? 'grab' : 'default' 
      }}
      className={`absolute inset-y-[1px] left-0 right-[1px] origin-left ${isMobile ? '' : 'transform-gpu'}`}
    >
      <div className={`absolute inset-0 ${paperClass} border-y border-r border-stone-200/60 rounded-r-[1px] overflow-hidden shadow-sm`} style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
        <div className={`absolute inset-0 ${paperTextureClass} pointer-events-none`} />
        <PhotoGrid layout={frontPage.layout} photos={frontPage.photos} progress={progress} onSelect={onSelect} pageNum={pageNum} />
        <div className="absolute top-0 bottom-0 left-0 w-8 bg-gradient-to-r from-black/5 to-transparent pointer-events-none" />
        <motion.div style={{ opacity }} className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-transparent pointer-events-none" />
      </div>

      <div className={`absolute inset-0 ${paperClass} border-y border-l border-stone-200/60 rounded-l-[1px] overflow-hidden shadow-sm`} style={{ transform: 'rotateY(180deg) translateZ(1px)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
         <div className={`absolute inset-0 ${paperTextureClass} pointer-events-none`} />
         <PhotoGrid layout={backPage.layout} photos={backPage.photos} progress={progress} isBackPage={true} onSelect={onSelect} pageNum={pageNum + 1} />
         <div className="absolute top-0 bottom-0 right-0 w-8 bg-gradient-to-l from-black/5 to-transparent pointer-events-none" />
         <div className="absolute inset-0 bg-black/2 pointer-events-none" />
      </div>
    </motion.div>
  );
});

interface PhotoGridProps {
  layout: AlbumLayoutType;
  photos: Photo[];
  progress: MotionValue<number>;
  isBackPage?: boolean;
  onSelect: (photo: Photo) => void;
  pageNum?: number;
}

const PhotoGrid = React.memo(({ layout, photos, progress, isBackPage = false, onSelect, pageNum }: PhotoGridProps) => {
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
          cells: [
            { key: 0, col: 2, row: 1 }, // 上橫
            { key: 1, col: 1, row: 1 },
            { key: 2, col: 1, row: 1 },
          ],
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
              <PhotoItem photo={photo} index={i} progress={progress} isBackPage={isBackPage} onSelect={onSelect} />
            </div>
          );
        })}
      </div>
      {pageNum != null && (
        <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none">
          <span className="font-display text-[7px] text-[#b08d55] tracking-[0.3em] opacity-60">- {String(pageNum).padStart(2, '0')} -</span>
        </div>
      )}
    </div>
  );
});

interface PhotoItemProps {
  photo: Photo;
  index: number;
  progress: MotionValue<number>;
  isBackPage?: boolean;
  onSelect: (photo: Photo) => void;
}

const PhotoItem = React.memo(({ photo, index, progress, isBackPage = false, onSelect }: PhotoItemProps) => {
  const direction = index % 2 === 0 ? 1 : -1;
  const range = photo.orientation === 'portrait' ? 8 : 4; 
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
      style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
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
          {/* Grain Overlay on Photo */}
          <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none mix-blend-overlay" />
      </div>

      {/* Gold Accent Dot (Interactive Hint) */}
      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
         <div className="w-1 h-1 rounded-full bg-[#C5A065]" />
      </div>
    </motion.div>
  );
});
