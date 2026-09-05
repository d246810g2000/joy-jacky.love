import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { WeddingPhoto, WeddingStage } from '../../types';
import { PhotoCard } from './PhotoCard';
import { PhotoStageHeader } from './PhotoStageHeader';
import { FILTER_PAGE_SIZE, STAGE_PAGE_SIZE, usePhotoBatch } from '../../hooks/usePhotoBatch';
import { useIsMobile } from '../../hooks/useIsMobile';
import type { NameSearchScope } from '../../types';
import { PhotoNameScopeBar } from './PhotoNameScopeBar';

interface PhotoMasonryGridProps {
  stages: WeddingStage[];
  filteredPhotos: WeddingPhoto[] | null;
  isFiltered: boolean;
  onPhotoClick: (photo: WeddingPhoto) => void;
  onTagClick: (tag: string) => void;
  onNameClick?: (name: string) => void;
  onWatchVideo: (stageId: string) => void;
  onEnterChapter?: (stageId: string) => void;
  registerSection: (id: string) => (el: HTMLElement | null) => void;
  filterLabel?: string | null;
  onDownloadAll?: () => void;
  onShareFilter?: () => void;
  downloading?: boolean;
  downloadProgress?: { done: number; total: number } | null;
  compactHeaders?: boolean;
  nameScope?: NameSearchScope;
  onNameScopeChange?: (scope: NameSearchScope) => void;
  guestTable?: number | null;
  showNameScope?: boolean;
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
  onEnterChapter,
  registerSection,
  compactHeaders = false,
}: {
  stage: WeddingStage;
  index: number;
  onPhotoClick: (photo: WeddingPhoto) => void;
  onTagClick: (tag: string) => void;
  onNameClick?: (name: string) => void;
  onWatchVideo: (stageId: string) => void;
  onEnterChapter?: (stageId: string) => void;
  registerSection: (id: string) => (el: HTMLElement | null) => void;
  compactHeaders?: boolean;
}) {
  const isMobile = useIsMobile();
  const total = stage.photos.length;
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? stage.photos : stage.photos.slice(0, STAGE_PAGE_SIZE);
  const hasPreviewMore = !expanded && total > STAGE_PAGE_SIZE;

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
        visibleCount={hasPreviewMore ? visible.length : undefined}
        index={index}
        onWatchVideo={onWatchVideo}
        onExpandPhotos={() => onEnterChapter?.(stage.id)}
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
              compact
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
      {hasPreviewMore && !compactHeaders && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--photo-accent)]/30 bg-[var(--photo-accent)]/10 px-4 py-3 text-xs font-medium text-[var(--photo-gold-light)] transition active:scale-[0.99] active:bg-[var(--photo-accent)]/20"
        >
          查看本章全部 {total} 張照片
          <span aria-hidden>↓</span>
        </button>
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
  onEnterChapter,
  registerSection,
  filterLabel,
  onDownloadAll,
  onShareFilter,
  downloading = false,
  downloadProgress = null,
  compactHeaders = false,
  nameScope,
  onNameScopeChange,
  guestTable,
  showNameScope = false,
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
        <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] tracking-wide text-[var(--photo-gold-light)]/80">搜尋結果</p>
              <h2 className="font-serif mt-1 text-xl text-white/95">{filterLabel ?? '搜尋結果'}</h2>
              <p className="mt-1 text-sm text-white/50">找到 {filteredPhotos.length} 張照片</p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {onShareFilter && (
                <button
                  type="button"
                  onClick={onShareFilter}
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs text-[var(--photo-gold-light)] active:bg-white/10"
                >
                  分享連結
                </button>
              )}
              {onDownloadAll && filteredPhotos.length > 0 && (
                <button
                  type="button"
                  onClick={onDownloadAll}
                  disabled={downloading}
                  className="rounded-full border border-[var(--photo-accent)]/35 bg-[var(--photo-accent)]/15 px-4 py-2 text-xs font-medium text-[var(--photo-gold-light)] active:bg-[var(--photo-accent)]/25 disabled:opacity-60"
                >
                  {downloading && downloadProgress
                    ? `打包中 ${downloadProgress.done}/${downloadProgress.total}`
                    : `↓ 下載全部 (${filteredPhotos.length})`}
                </button>
              )}
            </div>
          </div>
          {showNameScope && onNameScopeChange && nameScope && (
            <PhotoNameScopeBar
              scope={nameScope}
              onScopeChange={onNameScopeChange}
              guestTable={guestTable}
            />
          )}
        </div>

        {filteredPhotos.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-10 text-center backdrop-blur-sm">
            <p className="font-serif text-lg text-white/90">找不到符合的照片</p>
            <p className="mt-2 text-sm text-white/50">
              試試輸入桌號數字，或親友關係如「高中同學」
            </p>
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
                  compact
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
          onEnterChapter={onEnterChapter}
          registerSection={registerSection}
          compactHeaders={compactHeaders}
        />
      ))}
      {compactHeaders && <div className="h-[45vh] shrink-0" aria-hidden />}
    </div>
  );
};
