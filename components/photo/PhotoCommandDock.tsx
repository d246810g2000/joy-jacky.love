import React from 'react';
import { Link } from 'react-router-dom';
import { PhotoInlineFilm } from './PhotoInlineFilm';
import { PhotoTimelineNav, type TimelineNavItem } from './PhotoTimelineNav';
import { PhotoSearchBar } from './PhotoSearchBar';
import { getStageFilmMarker } from '../../utils/weddingFilm';

interface PhotoCommandDockProps {
  navItems: TimelineNavItem[];
  activeStageId: string;
  onStageSelect: (stageId: string) => void;
  welcomeTitle?: string;
  resultCount: number | null;
  hasFilter: boolean;
  filterLabel?: string | null;
  autoExpandSearch?: boolean;
  onExpandSearchHandled?: () => void;
  onSearch: (query: string) => void;
  onOpenDrawer: () => void;
  onClearFilter?: () => void;
}

export const PhotoCommandDock: React.FC<PhotoCommandDockProps> = ({
  navItems,
  activeStageId,
  onStageSelect,
  welcomeTitle,
  resultCount,
  hasFilter,
  filterLabel,
  autoExpandSearch,
  onExpandSearchHandled,
  onSearch,
  onOpenDrawer,
  onClearFilter,
}) => {
  const marker = getStageFilmMarker(activeStageId);
  const activeItem = navItems.find((i) => i.id === activeStageId) ?? navItems[0];
  const filmTitle = activeItem?.label ?? '婚宴影片';
  const startSec = marker?.startSec ?? 0;
  const filmTime = marker?.filmTime ?? '00:00';

  return (
    <header
      className="photo-command-dock shrink-0 border-b border-white/10 bg-[#0c0b0a]/95 backdrop-blur-xl photo-safe-top"
      aria-label="相簿控制區"
    >
      <div className="flex items-center justify-between gap-2 px-3 pb-2 pt-2">
        <Link
          to="/"
          className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1.5 text-[11px] text-white/80"
        >
          ← 喜帖
        </Link>
        <p className="min-w-0 truncate text-center font-serif text-sm text-white/90">
          {welcomeTitle ?? '婚禮相簿'}
        </p>
        <div className="w-[52px]" aria-hidden />
      </div>

      <PhotoInlineFilm
        startSec={startSec}
        title={filmTitle}
        filmTime={filmTime}
        accent={marker?.accent}
      />

      {navItems.length > 0 && (
        <PhotoTimelineNav
          variant="dock"
          items={navItems}
          activeStageId={activeStageId}
          onSelect={onStageSelect}
          isSticky={false}
        />
      )}

      <div className="border-t border-white/8 px-3 py-2">
        <PhotoSearchBar
          variant="dock"
          resultCount={resultCount}
          hasFilter={hasFilter}
          filterLabel={filterLabel}
          autoExpand={autoExpandSearch}
          onExpandHandled={onExpandSearchHandled}
          onSearch={onSearch}
          onOpenDrawer={onOpenDrawer}
          onClearFilter={onClearFilter}
        />
      </div>
    </header>
  );
};
