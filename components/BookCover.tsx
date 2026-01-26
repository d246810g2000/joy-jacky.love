
import React, { useMemo } from 'react';
import { motion, useTransform, useMotionValue } from 'framer-motion';
import type { MotionValue } from 'framer-motion';
import { APP_CONTENT, WEDDING_PHOTOS } from '../constants';
import { Photo } from '../types';

interface BookCoverProps {
  progress: MotionValue<number>;
  onSelectPhoto: (photo: Photo) => void;
}

export const BookCover: React.FC<BookCoverProps> = ({ progress, onSelectPhoto }) => {
  // Enhanced rotation physics for a heavier, more realistic book feel
  const bookRotateX = useTransform(progress, [0, 0.25, 0.7], [0, 10, 55]); 
  const bookRotateZ = useTransform(progress, [0, 0.25, 0.9], [0, 2, 25]);
  const bookRotateY = useTransform(progress, [0, 0.25, 0.7], [0, 0, 15]);
  
  // Cover opens slightly faster to reveal content
  const coverRotateY = useTransform(progress, [0.25, 0.55], [0, -180]);
  
  // Staggered page turns with more organic, non-uniform variation
  // Adjusted end angles to create a natural "fanned" stack effect rather than a perfect block
  const page1RotateY = useTransform(progress, [0.30, 0.60], [0, -179]); // Base page, flat
  const page2RotateY = useTransform(progress, [0.35, 0.64], [0, -177]); // Tight stack
  const page3RotateY = useTransform(progress, [0.41, 0.69], [0, -174]); // Slight gap
  const page4RotateY = useTransform(progress, [0.47, 0.75], [0, -170]); // Increasing gap
  const page5RotateY = useTransform(progress, [0.54, 0.82], [0, -165]); // Loose
  const page6RotateY = useTransform(progress, [0.60, 0.89], [0, -159]); // Looser
  const page7RotateY = useTransform(progress, [0.66, 0.96], [0, -152]); // Fanned out

  const shadowOpacity = useTransform(progress, [0.25, 0.6], [0, 0.3]);

  // Slices of 4 photos per page
  const slices = useMemo(() => ({
    base: WEDDING_PHOTOS.slice(0, 4),
    p1: WEDDING_PHOTOS.slice(4, 8),
    p1B: WEDDING_PHOTOS.slice(8, 12),
    p2: WEDDING_PHOTOS.slice(12, 16),
    p2B: WEDDING_PHOTOS.slice(16, 20),
    p3: WEDDING_PHOTOS.slice(0, 4),        
    p3B: WEDDING_PHOTOS.slice(4, 8),
    p4: WEDDING_PHOTOS.slice(8, 12),
    p4B: WEDDING_PHOTOS.slice(12, 16),
    p5: WEDDING_PHOTOS.slice(16, 20),
    p5B: WEDDING_PHOTOS.slice(0, 4),
    p6: WEDDING_PHOTOS.slice(4, 8),
    p6B: WEDDING_PHOTOS.slice(8, 12),
    p7: WEDDING_PHOTOS.slice(12, 16),
    p7B: WEDDING_PHOTOS.slice(16, 20),
  }), []);

  // Elegant paper texture (Warm Linen)
  const paperBg = "bg-[#F9F7F2]"; // Warm cream/off-white
  const paperTexture = "repeating-linear-gradient(90deg, #F9F7F2, #F9F7F2 2px, #EBE8E0 3px, #EBE8E0 3px)";
  
  return (
    <motion.div
      style={{ 
        rotateX: bookRotateX,
        rotateZ: bookRotateZ,
        rotateY: bookRotateY,
        transformStyle: 'preserve-3d',
      }}
      // Added transform-gpu to ensure hardware acceleration
      className="relative w-[50vw] h-[70vw] max-w-[320px] max-h-[440px] shadow-2xl transform-gpu"
    >
      <div className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }}>
        {/* Book Spine / Back Cover Base */}
        <div className="absolute inset-0 bg-[#1e293b] rounded-[2px] shadow-2xl" style={{ transform: 'translateZ(-16px)', backfaceVisibility: 'hidden' }} />
        
        {/* Pages Block */}
        <div className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }}>
           {/* Page Thickness Effect */}
           <div className="absolute top-[2px] right-0 bottom-[2px] w-[16px] origin-right" style={{ background: paperTexture, transform: 'rotateY(-90deg)' }} />
           <div className="absolute bottom-0 left-[2px] right-0 h-[16px] origin-bottom" style={{ background: "#EBE8E0", transform: 'rotateX(-90deg)' }} />
           <div className="absolute top-0 left-[2px] right-0 h-[16px] origin-top" style={{ background: "#EBE8E0", transform: 'rotateX(90deg)' }} />
           
           {/* Static Base Page */}
           <div className={`absolute inset-0 ${paperBg} border border-stone-200/50`} style={{ transform: 'translateZ(0px)' }}>
              <PhotoGrid photos={slices.base} progress={progress} onSelect={onSelectPhoto} layout="editorial" pageNum={1} />
           </div>
        </div>
      </div>

      <FanPage rotateY={page7RotateY} index={1} opacity={shadowOpacity} photos={slices.p7} backPhotos={slices.p7B} progress={progress} onSelect={onSelectPhoto} layout="grid" pageNum={14} />
      <FanPage rotateY={page6RotateY} index={2} opacity={shadowOpacity} photos={slices.p6} backPhotos={slices.p6B} progress={progress} onSelect={onSelectPhoto} layout="editorial" pageNum={12} />
      <FanPage rotateY={page5RotateY} index={3} opacity={shadowOpacity} photos={slices.p5} backPhotos={slices.p5B} progress={progress} onSelect={onSelectPhoto} layout="grid" pageNum={10} />
      <FanPage rotateY={page4RotateY} index={4} opacity={shadowOpacity} photos={slices.p4} backPhotos={slices.p4B} progress={progress} onSelect={onSelectPhoto} layout="editorial" pageNum={8} />
      <FanPage rotateY={page3RotateY} index={5} opacity={shadowOpacity} photos={slices.p3} backPhotos={slices.p3B} progress={progress} onSelect={onSelectPhoto} layout="grid" pageNum={6} />
      <FanPage rotateY={page2RotateY} index={6} opacity={shadowOpacity} photos={slices.p2} backPhotos={slices.p2B} progress={progress} onSelect={onSelectPhoto} layout="editorial" pageNum={4} />
      <FanPage rotateY={page1RotateY} index={7} opacity={shadowOpacity} photos={slices.p1} backPhotos={slices.p1B} progress={progress} onSelect={onSelectPhoto} layout="grid" pageNum={2} />

      {/* --- FRONT COVER DESIGN (High End) --- */}
      <motion.div
        style={{ rotateY: coverRotateY, transformStyle: 'preserve-3d', transformOrigin: 'left', zIndex: 50 }}
        className="absolute inset-0"
      >
        {/* Outer Front Cover */}
        <div className="absolute inset-0 bg-[#0B1221] rounded-r-[2px] flex flex-col items-center shadow-2xl border-l border-white/10 overflow-hidden" style={{ backfaceVisibility: 'hidden' }}>
          
          {/* 1. Luxurious Dark Navy Base Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#020617]" />

          {/* 2. Metallic Gold Thread Weave Effect */}
          {/* Diagonal hatch pattern to simulate woven metallic fabric */}
          <div className="absolute inset-0 opacity-[0.08] mix-blend-plus-lighter" 
               style={{ 
                  backgroundImage: "repeating-linear-gradient(45deg, #C5A065 0px, #C5A065 1px, transparent 1px, transparent 3px)" 
               }} 
          />
          <div className="absolute inset-0 opacity-[0.06] mix-blend-plus-lighter" 
               style={{ 
                  backgroundImage: "repeating-linear-gradient(-45deg, #C5A065 0px, #C5A065 1px, transparent 1px, transparent 3px)" 
               }} 
          />

          {/* 3. Linen Texture Overlay (Maintains tactile feel) */}
          <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/black-linen.png')] mix-blend-overlay pointer-events-none" />
          
          {/* 4. Subtle Gloss Sheen (Simulates light catching the metallic threads) */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-[#C5A065]/5 to-transparent opacity-40 pointer-events-none" />
          
          {/* Double Gold Border */}
          <div className="absolute inset-4 border border-[#C5A065]/40 rounded-[1px] pointer-events-none" />
          <div className="absolute inset-5 border-[0.5px] border-[#C5A065]/70 rounded-[1px] pointer-events-none" />

          {/* Cover Content */}
          <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-8 text-center">
            
            <div className="space-y-5">
               {/* Shortened top line to pull text up */}
               <div className="w-px h-8 bg-gradient-to-b from-transparent via-[#C5A065] to-transparent mx-auto opacity-60" />
               
               {/* Smaller font size (7px) and slight margin adjust */}
               <p className="font-display text-[7px] tracking-[0.4em] text-[#9ca3af] uppercase mb-1">The Wedding Album</p>
               
               <div className="space-y-1">
                 {/* Reduced text size to 3xl on mobile, 4xl on desktop */}
                 <h1 className="font-script text-3xl md:text-4xl text-[#E8DCC4] drop-shadow-md whitespace-nowrap bg-clip-text text-transparent bg-gradient-to-r from-[#E8DCC4] via-[#FDFBF7] to-[#E8DCC4]">{APP_CONTENT.coupleName}</h1>
                 
                 {/* UPDATED: Replaced Hsinchu with Eternity for a more romantic vibe */}
                 <p className="font-serif text-[10px] tracking-[0.25em] text-[#C5A065] uppercase mt-2">Eternity</p>
               </div>

               <div className="w-px h-12 bg-gradient-to-t from-transparent via-[#C5A065] to-transparent mx-auto opacity-60" />
            </div>

            {/* Realistic Debossed Stamp Logo */}
            <div className="absolute bottom-8">
                {/* Outer depression (Inset Shadow) */}
                <div className="w-10 h-10 rounded-full border border-[#C5A065]/30 flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.5),0_1px_1px_rgba(255,255,255,0.05)] bg-[#0F172A]/40">
                    {/* Inner raised ring */}
                    <div className="w-8 h-8 rounded-full border-[0.5px] border-[#C5A065]/50 flex items-center justify-center shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
                        <span className="font-display text-[9px] text-[#C5A065] font-bold tracking-widest opacity-90" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>J&J</span>
                    </div>
                </div>
            </div>

          </div>
        </div>

        {/* Inner Left Cover (Inside of the hard cover) */}
        <div className="absolute inset-0 bg-[#F9F7F2] rounded-r-[2px] overflow-hidden border-r border-stone-200 shadow-inner" style={{ transform: 'rotateY(180deg) translateZ(1px)', backfaceVisibility: 'hidden' }}>
           {/* Paper Texture */}
           <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]" />
           
           <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
              <p className="font-serif italic text-2xl text-[#1a1d23]/80 mb-4">"執子之手，<br/>與子偕老"</p>
              <div className="w-12 h-[1px] bg-[#C5A065] opacity-50 mb-4" />
              <p className="font-display text-[9px] text-[#888] tracking-widest uppercase leading-loose">
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
  index: number;
  opacity: MotionValue<number>;
  photos: Photo[];
  backPhotos?: Photo[]; 
  progress: MotionValue<number>;
  onSelect: (photo: Photo) => void;
  layout?: 'grid' | 'editorial';
  pageNum: number;
}

const FanPage = React.memo(({ rotateY, index, opacity, photos, backPhotos, progress, onSelect, layout = 'grid', pageNum }: FanPageProps) => {
  const x = useMotionValue(0);
  const dragRotateY = useTransform(x, [-100, 100], [-35, 35]);
  const combinedRotateY = useTransform([rotateY, dragRotateY], ([s, d]: any) => s + d);

  // Paper color and texture
  const paperClass = "bg-[#F9F7F2]";
  const paperTextureClass = "bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-40";

  return (
    <motion.div
      drag="x" dragConstraints={{ left: 0, right: 0 }}
      style={{ rotateY: combinedRotateY, x, transformStyle: 'preserve-3d', transformOrigin: 'left', zIndex: index, cursor: 'grab' }}
      className="absolute inset-y-[1px] left-0 right-[1px] origin-left transform-gpu"
    >
      {/* Front of Page */}
      <div className={`absolute inset-0 ${paperClass} border-y border-r border-stone-200/60 rounded-r-[1px] overflow-hidden shadow-sm`} style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
        <div className={`absolute inset-0 ${paperTextureClass} pointer-events-none`} />
        <PhotoGrid photos={photos} progress={progress} onSelect={onSelect} layout={layout} pageNum={pageNum} />
        {/* Shadow Gradient for depth near spine */}
        <div className="absolute top-0 bottom-0 left-0 w-8 bg-gradient-to-r from-black/5 to-transparent pointer-events-none" />
        <motion.div style={{ opacity }} className="absolute inset-0 bg-gradient-to-r from-black/10 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* Back of Page */}
      <div className={`absolute inset-0 ${paperClass} border-y border-l border-stone-200/60 rounded-l-[1px] overflow-hidden shadow-sm`} style={{ transform: 'rotateY(180deg) translateZ(1px)', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
         <div className={`absolute inset-0 ${paperTextureClass} pointer-events-none`} />
         {backPhotos && <PhotoGrid photos={backPhotos} progress={progress} isBackPage={true} onSelect={onSelect} layout={layout === 'grid' ? 'editorial' : 'grid'} pageNum={pageNum + 1} />}
         {/* Shadow Gradient for depth near spine */}
         <div className="absolute top-0 bottom-0 right-0 w-8 bg-gradient-to-l from-black/5 to-transparent pointer-events-none" />
         <div className="absolute inset-0 bg-black/2 pointer-events-none" />
      </div>
    </motion.div>
  );
});

interface PhotoGridProps {
  photos: Photo[];
  progress: MotionValue<number>;
  isBackPage?: boolean;
  onSelect: (photo: Photo) => void;
  layout?: 'grid' | 'editorial';
  pageNum?: number;
}

const PhotoGrid = React.memo(({ photos, progress, isBackPage = false, onSelect, layout = 'grid', pageNum }: PhotoGridProps) => {
  // Use padding to create "Matte Board" effect (negative space)
  const containerPadding = layout === 'editorial' ? 'p-4 md:p-5' : 'p-3 md:p-4';

  return (
    <div className={`absolute inset-0 ${containerPadding} flex flex-col justify-between overflow-hidden`}>
      <div className={`w-full h-full grid ${layout === 'editorial' ? 'grid-cols-2 grid-rows-3' : 'grid-cols-2 grid-rows-2'} gap-3`}>
        {photos.slice(0, 4).map((p, i) => {
          // --- Layout Logic ---
          let classes = "relative overflow-hidden";
          
          if (layout === 'editorial') {
             // Editorial: First item is large (Top Half), others are smaller
             if (i === 0) classes += " col-span-2 row-span-2";
             else if (i === 1) classes += " col-span-1 row-span-1"; // Hidden or small?
             else if (i === 2) classes += " col-span-1 row-span-1";
             else classes += " hidden"; // Hide 4th photo in editorial mode to keep it clean
          } else {
             // Grid: Standard 2x2
             classes += " col-span-1 row-span-1";
          }

          return (
            <div key={p.id} className={classes}>
               <PhotoItem photo={p} index={i} progress={progress} isBackPage={isBackPage} onSelect={onSelect} />
            </div>
          );
        })}
      </div>
      
      {/* Elegant Page Number */}
      {pageNum && (
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

  return (
    <motion.div 
      onClick={() => onSelect(photo)}
      whileHover={{ scale: 1.01 }}
      // Elegant Photo Frame Style:
      // 1. White border (Matte)
      // 2. Subtle shadow for depth
      // 3. No harsh borders, just clean paper feel
      className="relative w-full h-full bg-white p-[3px] md:p-[4px] shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(197,160,101,0.15)] cursor-pointer transition-all duration-500 ease-out group"
      style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
    >
      <div className="relative w-full h-full overflow-hidden bg-stone-100">
          <motion.img 
            src={photo.url} 
            style={{ y: parallaxY }} 
            className={`absolute inset-0 w-full h-[115%] -top-[7.5%] object-cover opacity-[0.93] hover:opacity-100 transition-opacity duration-500 filter sepia-[0.05] contrast-[1.02]`} 
            alt={photo.alt} 
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
