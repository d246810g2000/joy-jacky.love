import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PhotoInlineFilm } from './PhotoInlineFilm';
import { PhotoTimelineNav, type TimelineNavItem } from './PhotoTimelineNav';
import { getStageFilmMarker } from '../../utils/weddingFilm';
import { useIsMobile } from '../../hooks/useIsMobile';
import {
  PHOTO_THEME,
  readFilmExpanded,
  writeFilmExpanded,
} from '../../utils/photoTheme';

interface PhotoCommandDockProps {
  navItems: TimelineNavItem[];
  activeStageId: string;
  onStageSelect: (stageId: string) => void;
  welcomeTitle?: string;
  hasFilter: boolean;
  onClearFilter?: () => void;
  isChapterFocused?: boolean;
  onExitChapter?: () => void;
  filmStageId?: string | null;
  onFilmExpandedChange?: (expanded: boolean) => void;
  loading?: boolean;
  hideTimeline?: boolean;
}

export const PhotoCommandDock: React.FC<PhotoCommandDockProps> = ({
  navItems,
  activeStageId,
  onStageSelect,
  welcomeTitle,
  hasFilter,
  onClearFilter,
  isChapterFocused = false,
  onExitChapter,
  filmStageId = null,
  onFilmExpandedChange,
  loading = false,
  hideTimeline = false,
}) => {
  const isMobile = useIsMobile();
  const [filmExpanded, setFilmExpanded] = useState(readFilmExpanded);

  useEffect(() => {
    writeFilmExpanded(filmExpanded);
    onFilmExpandedChange?.(filmExpanded);
  }, [filmExpanded, onFilmExpandedChange]);

  useEffect(() => {
    if (!filmStageId) return;
    setFilmExpanded(true);
  }, [filmStageId]);

  useEffect(() => {
    if (isChapterFocused) {
      setFilmExpanded(false);
    }
  }, [isChapterFocused]);

  const displayedStageId = filmStageId ?? activeStageId;
  const marker = getStageFilmMarker(displayedStageId);
  const activeIndex = navItems.findIndex((i) => i.id === displayedStageId);
  const activeItem = navItems[activeIndex] ?? navItems[0];
  const filmTitle = activeItem?.label ?? '婚宴影片';
  const clockTime = activeItem?.time;
  const startSec = marker?.startSec ?? 0;
  const filmTime = marker?.filmTime ?? '00:00';

  return (
    <header
      className="photo-command-dock shrink-0 border-b border-white/10 photo-safe-top"
      aria-label="相簿控制區"
    >
      <div className="px-3 pb-2 pt-2">
        <div className="flex items-center justify-between gap-2">
          {isChapterFocused && onExitChapter ? (
            <button
              type="button"
              onClick={onExitChapter}
              className="photo-dock-back rounded-full border px-2.5 py-1.5 text-[11px]"
            >
              ← 相簿
            </button>
          ) : hasFilter && onClearFilter ? (
            <button
              type="button"
              onClick={onClearFilter}
              className="photo-dock-back rounded-full border px-2.5 py-1.5 text-[11px]"
            >
              ← 相簿
            </button>
          ) : (
            <Link
              to="/"
              onClick={() => sessionStorage.setItem('home_return_section', 'photos')}
              className="photo-dock-back rounded-full border px-2.5 py-1.5 text-[11px]"
            >
              ← 喜帖
            </Link>
          )}
          <div className="min-w-0 flex-1 text-center">
            <p className="photo-dock-title truncate whitespace-nowrap font-serif text-[13px] md:text-sm">
              {welcomeTitle ?? 'Joy & Jacky 婚禮相簿'}
            </p>
            {!welcomeTitle && (
              <p className="photo-dock-tagline mt-0.5 hidden truncate text-[10px] tracking-wide md:block">
                {PHOTO_THEME.tagline}
              </p>
            )}
          </div>
          <div className="w-[52px]" aria-hidden />
        </div>
      </div>

      {loading ? (
        <div className="space-y-2 border-y border-white/8 px-3 py-2.5" aria-label="相簿載入中">
          <div className="photo-skeleton-dark h-8 rounded-xl" />
          <div className="flex gap-1.5 overflow-hidden">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="photo-skeleton-dark h-7 w-20 shrink-0 rounded-full" />
            ))}
          </div>
        </div>
      ) : !hasFilter && (
        <PhotoInlineFilm
          startSec={startSec}
          title={filmTitle}
          filmTime={filmTime}
          clockTime={clockTime}
          accent={marker?.accent}
          expanded={filmExpanded}
          onExpandedChange={setFilmExpanded}
        />
      )}

      {!isMobile && !hideTimeline && navItems.length > 0 && (
        <PhotoTimelineNav
          variant="dock"
          items={navItems}
          activeStageId={activeStageId}
          onSelect={onStageSelect}
          isSticky={false}
        />
      )}

    </header>
  );
};
