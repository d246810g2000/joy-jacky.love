import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import type { WeddingPhoto, WeddingStage } from '../../types';
import { PhotoCard } from './PhotoCard';
import { PhotoStageHeader } from './PhotoStageHeader';
import { FILTER_PAGE_SIZE, STAGE_PAGE_SIZE, usePhotoBatch } from '../../hooks/usePhotoBatch';
import { useIsMobile } from '../../hooks/useIsMobile';

interface PhotoMasonryGridProps {
  stages: WeddingStage[];
  filteredPhotos: WeddingPhoto[] | null;
  isFiltered: boolean;
  onPhotoClick: (photo: WeddingPhoto) => void;
  onTagClick: (tag: string) => void;
  onNameClick?: (name: string) => void;
  onWatchVideo: (stageId: string) => void;
  registerSection: (id: string) => (el: HTMLElement | null) => void;
  filterLabel?: string | null;
  onClearFilter?: () => void;
  compactHeaders?: boolean;
}

function LoadMoreSkeleton() {
  return (
    <div className="photo-masonry mt-3" aria-hidden>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="photo-skeleton-dark mb-3 break-inside-avoid rounded-2xl"
          style={{ height: i % 2 === 0 ? 220 : 280 }}
        />
      ))}
    </div>
  );
}

function StageSection({
  stage,
  index,
  onPhotoClick,
  onTagClick,
  onNameClick,
  onWatchVideo,
  registerSection,
  compactHeaders = false,
}: {
  stage: WeddingStage;
  index: number;
  onPhotoClick: (photo: WeddingPhoto) => void;
  onTagClick: (tag: string) => void;
  onNameClick?: (name: string) => void;
  onWatchVideo: (stageId: string) => void;
  registerSection: (id: string) => (el: HTMLElement | null) => void;
  compactHeaders?: boolean;
}) {
  const isMobile = useIsMobile();
  const total = stage.photos.length;
  const { visibleCount, sentinelRef, hasMore } = usePhotoBatch(total, STAGE_PAGE_SIZE, stage.id);
  const visible = stage.photos.slice(0, visibleCount);

  return (
    <section
      id={`stage-${stage.id}`}
      ref={registerSection(stage.id)}
      data-stage-id={stage.id}
      className={compactHeaders ? 'scroll-mt-2' : 'scroll-mt-20'}
    >
      <PhotoStageHeader
        stage={stage}
        photoCount={total}
        visibleCount={hasMore ? visibleCount : undefined}
        index={index}
        onWatchVideo={onWatchVideo}
        compact={compactHeaders}
      />
      <motion.div
        initial={isMobile ? undefined : { opacity: 0 }}
        whileInView={isMobile ? undefined : { opacity: 1 }}
        viewport={{ once: true, margin: '-5%' }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="photo-masonry"
      >
        {visible.map((photo, i) =>
          isMobile ? (
            <PhotoCard
              key={photo.id}
              photo={photo}
              onClick={onPhotoClick}
              onTagClick={onTagClick}
              onNameClick={onNameClick}
              dark
            />
          ) : (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-5%' }}
              transition={{ duration: 0.4, delay: Math.min(i * 0.03, 0.3) }}
            >
              <PhotoCard
                photo={photo}
                onClick={onPhotoClick}
                onTagClick={onTagClick}
                onNameClick={onNameClick}
                dark
              />
            </motion.div>
          )
        )}
      </motion.div>
      {hasMore && (
        <>
          <LoadMoreSkeleton />
          <div ref={sentinelRef} className="h-4" aria-hidden />
        </>
      )}
    </section>
  );
}

export const PhotoMasonryGrid: React.FC<PhotoMasonryGridProps> = ({
  stages,
  filteredPhotos,
  isFiltered,
  onPhotoClick,
  onTagClick,
  onNameClick,
  onWatchVideo,
  registerSection,
  filterLabel,
  onClearFilter,
  compactHeaders = false,
}) => {
  const filterTotal = filteredPhotos?.length ?? 0;
  const { visibleCount, sentinelRef, hasMore } = usePhotoBatch(
    filterTotal,
    FILTER_PAGE_SIZE,
    isFiltered ? JSON.stringify(filteredPhotos?.map((p) => p.id)) : 'timeline'
  );

  useEffect(() => {
    if (!isFiltered || compactHeaders) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [isFiltered, filterLabel, compactHeaders]);

  const bottomPad = compactHeaders ? 'pb-8' : 'pb-32';
  const topPad = compactHeaders ? 'pt-4' : 'pt-6';

  if (isFiltered && filteredPhotos) {
    const visible = filteredPhotos.slice(0, visibleCount);

    return (
      <section className={`px-4 ${bottomPad} ${topPad} md:px-8`} aria-live="polite">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-xl text-white/95">{filterLabel ?? '搜尋結果'}</h2>
            <p className="mt-1 text-sm text-white/50">找到 {filteredPhotos.length} 張照片</p>
          </div>
          {onClearFilter && (
            <button
              type="button"
              onClick={onClearFilter}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-[#e6c896] backdrop-blur-sm hover:bg-white/10"
            >
              清除篩選 · 回到時間軸
            </button>
          )}
        </div>

        {filteredPhotos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-10 text-center backdrop-blur-sm">
            <p className="font-serif text-lg text-white/90">找不到符合的照片</p>
            <p className="mt-2 text-sm text-white/50">
              試試輸入桌號數字，或親友關係如「高中同學」
            </p>
            {onClearFilter && (
              <button
                type="button"
                onClick={onClearFilter}
                className="mt-4 rounded-full bg-[#B08D55] px-5 py-2 text-sm text-white"
              >
                清除篩選
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="photo-masonry">
              {visible.map((photo) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  onClick={onPhotoClick}
                  onTagClick={onTagClick}
                  onNameClick={onNameClick}
                  dark
                />
              ))}
            </div>
            {hasMore && (
              <>
                <LoadMoreSkeleton />
                <div ref={sentinelRef} className="py-4" aria-hidden />
              </>
            )}
          </>
        )}
      </section>
    );
  }

  return (
    <div className={`space-y-10 px-4 ${bottomPad} ${compactHeaders ? 'pt-4' : 'pt-8'} md:space-y-14 md:px-8`}>
      {stages.map((stage, index) => (
        <StageSection
          key={stage.id}
          stage={stage}
          index={index}
          onPhotoClick={onPhotoClick}
          onTagClick={onTagClick}
          onNameClick={onNameClick}
          onWatchVideo={onWatchVideo}
          registerSection={registerSection}
          compactHeaders={compactHeaders}
        />
      ))}
    </div>
  );
};
