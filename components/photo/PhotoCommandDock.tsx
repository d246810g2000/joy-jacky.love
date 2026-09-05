import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PhotoInlineFilm } from './PhotoInlineFilm';
import { PhotoTimelineNav, type TimelineNavItem } from './PhotoTimelineNav';
import { PhotoSearchBar } from './PhotoSearchBar';
import { getStageFilmMarker } from '../../utils/weddingFilm';
import type { NameSearchScope } from '../../types';
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
  resultCount: number | null;
  hasFilter: boolean;
  filterLabel?: string | null;
  autoExpandSearch?: boolean;
  onExpandSearchHandled?: () => void;
  onSearch: (query: string) => void;
  onOpenDrawer: () => void;
  onClearFilter?: () => void;
  nameScope?: NameSearchScope;
  onNameScopeChange?: (scope: NameSearchScope) => void;
  guestTable?: number | null;
  showNameScope?: boolean;
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
  nameScope,
  onNameScopeChange,
  guestTable,
  showNameScope = false,
}) => {
  const [filmExpanded, setFilmExpanded] = useState(readFilmExpanded);

  useEffect(() => {
    writeFilmExpanded(filmExpanded);
  }, [filmExpanded]);

  const marker = getStageFilmMarker(activeStageId);
  const activeIndex = navItems.findIndex((i) => i.id === activeStageId);
  const activeItem = navItems[activeIndex] ?? navItems[0];
  const filmTitle = activeItem?.label ?? '婚宴影片';
  const clockTime = activeItem?.time;
  const startSec = marker?.startSec ?? 0;
  const filmTime = marker?.filmTime ?? '00:00';

  return (
    <header
      className="photo-command-dock shrink-0 border-b border-white/10 bg-[var(--photo-bg)]/95 backdrop-blur-xl photo-safe-top"
      aria-label="相簿控制區"
    >
      <div className="px-3 pb-2 pt-2">
        <div className="flex items-center justify-between gap-2">
          <Link
            to="/"
            className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1.5 text-[11px] text-white/80"
          >
            ← 喜帖
          </Link>
          <div className="min-w-0 flex-1 text-center">
            <p className="truncate font-serif text-sm text-white/95">
              {welcomeTitle ?? 'Joy & Jacky 婚禮相簿'}
            </p>
            {!welcomeTitle && (
              <p className="mt-0.5 truncate text-[10px] tracking-wide text-white/40">
                {PHOTO_THEME.tagline}
              </p>
            )}
          </div>
          <div className="w-[52px]" aria-hidden />
        </div>
      </div>

      {!hasFilter && (
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

      {navItems.length > 0 && (
        <PhotoTimelineNav
          variant="dock"
          items={navItems}
          activeStageId={activeStageId}
          onSelect={onStageSelect}
          isSticky={false}
        />
      )}

      <div className="border-t border-white/8 px-3 py-1.5">
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
          nameScope={nameScope}
          onNameScopeChange={onNameScopeChange}
          guestTable={guestTable}
          showNameScope={showNameScope}
        />
      </div>
    </header>
  );
};
