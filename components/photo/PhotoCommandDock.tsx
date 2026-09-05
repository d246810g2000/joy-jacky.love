import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PhotoInlineFilm } from './PhotoInlineFilm';
import { PhotoTimelineNav, type TimelineNavItem } from './PhotoTimelineNav';
import { PhotoSearchBar } from './PhotoSearchBar';
import { getStageFilmMarker } from '../../utils/weddingFilm';
import { useIsMobile } from '../../hooks/useIsMobile';
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
  loading?: boolean;
  filterLabel?: string | null;
  autoExpandSearch?: boolean;
  onExpandSearchHandled?: () => void;
  onSearch: (query: string) => void;
  onTagSearch?: (tag: string) => void;
  onOpenDrawer: () => void;
  onClearFilter?: () => void;
  onDownloadAll?: () => void;
  onShareFilter?: () => void;
  downloading?: boolean;
  downloadProgress?: { done: number; total: number } | null;
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
  loading = false,
  filterLabel,
  autoExpandSearch,
  onExpandSearchHandled,
  onSearch,
  onTagSearch,
  onOpenDrawer,
  onClearFilter,
  onDownloadAll,
  onShareFilter,
  downloading,
  downloadProgress,
  nameScope,
  onNameScopeChange,
  guestTable,
  showNameScope = false,
}) => {
  const isMobile = useIsMobile();
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
      className="photo-command-dock shrink-0 border-b border-white/10 photo-safe-top"
      aria-label="相簿控制區"
    >
      <div className="px-3 pb-2 pt-2">
        <div className="flex items-center justify-between gap-2">
          <Link
            to="/"
            className="photo-dock-back rounded-full border px-2.5 py-1.5 text-[11px]"
          >
            ← 喜帖
          </Link>
          <div className="min-w-0 flex-1 text-center">
            <p className="photo-dock-title truncate font-serif text-sm">
              {welcomeTitle ?? 'Joy & Jacky 婚禮相簿'}
            </p>
            {!welcomeTitle && (
              <p className="photo-dock-tagline mt-0.5 truncate text-[10px] tracking-wide">
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

      {!isMobile && navItems.length > 0 && (
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
          onTagSearch={onTagSearch}
          onOpenDrawer={onOpenDrawer}
          onClearFilter={onClearFilter}
          onDownloadAll={onDownloadAll}
          onShareFilter={onShareFilter}
          downloading={downloading}
          downloadProgress={downloadProgress}
          nameScope={nameScope}
          onNameScopeChange={onNameScopeChange}
          guestTable={guestTable}
          showNameScope={showNameScope}
        />
      </div>
    </header>
  );
};
