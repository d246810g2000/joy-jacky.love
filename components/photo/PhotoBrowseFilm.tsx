import React from 'react';
import { getStageFilmMarker } from '../../utils/weddingFilm';
import {
  getFilmStageIdForPlayer,
  getStageAccent,
  getStageNavTime,
  stageHasFilm,
} from '../../utils/photoStageMeta';
import { PhotoInlineFilm } from './PhotoInlineFilm';
import type { TimelineNavItem } from './PhotoTimelineNav';

interface PhotoBrowseFilmProps {
  activeStageId: string;
  filmStageRequest?: string | null;
  filmExpanded: boolean;
  onFilmExpandedChange: (expanded: boolean) => void;
  navItems: TimelineNavItem[];
  className?: string;
  /** 桌機觀影：限制畫幅高度，避免蓋住相簿操作 */
  cinema?: boolean;
}

export const PhotoBrowseFilm: React.FC<PhotoBrowseFilmProps> = ({
  activeStageId,
  filmStageRequest = null,
  filmExpanded,
  onFilmExpandedChange,
  navItems,
  className = '',
  cinema = false,
}) => {
  const displayedStageId = filmStageRequest ?? activeStageId;
  const filmPlayerStageId = getFilmStageIdForPlayer(displayedStageId);
  const marker = getStageFilmMarker(filmPlayerStageId);
  const accent = getStageAccent(displayedStageId);
  const activeIndex = navItems.findIndex((item) => item.id === displayedStageId);
  const activeItem = navItems[activeIndex] ?? navItems[0];
  const syncedToGallery = stageHasFilm(displayedStageId);
  const filmTitle = syncedToGallery
    ? activeItem?.label ?? '婚宴影片'
    : '婚宴全紀錄';
  const clockTime = syncedToGallery
    ? getStageNavTime(displayedStageId, activeItem?.time ?? '')
    : undefined;
  const startSec = marker?.startSec ?? 0;
  const filmTime = marker?.filmTime ?? '00:00';

  return (
    <div className={className}>
      <PhotoInlineFilm
        startSec={startSec}
        title={filmTitle}
        filmTime={filmTime}
        clockTime={clockTime}
        accent={syncedToGallery ? accent : marker?.accent ?? accent}
        expanded={filmExpanded}
        onExpandedChange={onFilmExpandedChange}
        cinema={cinema}
      />
    </div>
  );
};
