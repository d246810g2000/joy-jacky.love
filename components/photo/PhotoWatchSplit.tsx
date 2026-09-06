import React, { useMemo } from 'react';
import type { WeddingPhoto, WeddingStage } from '../../types';
import { getStageLabel } from '../../utils/photoStageMeta';
import { PhotoBrowseFilm } from './PhotoBrowseFilm';
import { PhotoMasonryGrid } from './PhotoMasonryGrid';
import { PhotoTimelineNav, type TimelineNavItem } from './PhotoTimelineNav';

interface PhotoWatchSplitProps {
  navItems: TimelineNavItem[];
  stages: WeddingStage[];
  activeStageId: string;
  filmStageRequest: string | null;
  onStageSelect: (stageId: string) => void;
  onFilmExpandedChange: (expanded: boolean) => void;
  onPhotoClick: (photo: WeddingPhoto) => void;
  onTagClick: (tag: string) => void;
  onNameClick?: (name: string) => void;
  onWatchVideo: (stageId: string) => void;
  registerSection: (id: string) => (el: HTMLElement | null) => void;
}

export const PhotoWatchSplit: React.FC<PhotoWatchSplitProps> = ({
  navItems,
  stages,
  activeStageId,
  filmStageRequest,
  onStageSelect,
  onFilmExpandedChange,
  onPhotoClick,
  onTagClick,
  onNameClick,
  onWatchVideo,
  registerSection,
}) => {
  const watchStageId = filmStageRequest ?? activeStageId;
  const watchStages = useMemo(() => {
    const matched = stages.filter((stage) => stage.id === watchStageId);
    return matched.length > 0 ? matched : stages.slice(0, 1);
  }, [stages, watchStageId]);

  const stageLabel = getStageLabel(
    watchStages[0]?.id ?? watchStageId,
    watchStages[0]?.title
  );

  return (
    <div
      className="photo-watch-split fixed inset-0 z-[45] flex flex-col bg-[#0c0b0a] photo-safe-top photo-safe-bottom"
      role="dialog"
      aria-modal="true"
      aria-label="邊看影片邊瀏覽照片"
    >
      <header className="photo-watch-split__header shrink-0 border-b border-white/10 bg-[#0c0b0a]/95">
        <div className="flex items-center justify-between gap-3 px-4 py-2.5">
          <button
            type="button"
            onClick={() => onFilmExpandedChange(false)}
            className="shrink-0 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/85 transition hover:bg-white/10"
          >
            ← 回到相簿
          </button>
          <p className="min-w-0 truncate text-center text-xs text-white/45">
            左側影片 · 右側照片
            {stageLabel ? <span className="text-white/70"> · {stageLabel}</span> : null}
          </p>
          <div className="w-[88px] shrink-0" aria-hidden />
        </div>
        {navItems.length > 0 && (
          <PhotoTimelineNav
            items={navItems}
            activeStageId={watchStageId}
            onSelect={onStageSelect}
            isSticky={false}
            variant="dock"
          />
        )}
      </header>

      <div className="photo-watch-split__body flex min-h-0 flex-1">
        <section className="photo-watch-split__film flex min-w-0 flex-col bg-black" aria-label="婚宴影片">
          <PhotoBrowseFilm
            className="flex h-full min-h-0 flex-col"
            activeStageId={activeStageId}
            filmStageRequest={filmStageRequest}
            filmExpanded
            onFilmExpandedChange={onFilmExpandedChange}
            navItems={navItems}
            cinema
            split
          />
        </section>

        <section
          className="photo-watch-split__photos min-h-0 min-w-0 overflow-y-auto overscroll-contain"
          aria-label={`${stageLabel || '本章'}照片`}
        >
          <div className="sticky top-0 z-10 border-b border-white/8 bg-[#0c0b0a]/92 px-4 py-2.5 backdrop-blur-md">
            <p className="text-[10px] tracking-wide text-white/40">本章照片</p>
            <p className="truncate font-serif text-sm text-white/90">{stageLabel || '婚禮相簿'}</p>
          </div>
          <PhotoMasonryGrid
            stages={watchStages}
            filteredPhotos={null}
            isFiltered={false}
            onPhotoClick={onPhotoClick}
            onTagClick={onTagClick}
            onNameClick={onNameClick}
            onWatchVideo={onWatchVideo}
            showAllPhotos
            registerSection={registerSection}
            compactHeaders
            omitEndSpacer
          />
        </section>
      </div>
    </div>
  );
};
