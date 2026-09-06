import { getStageFilmMarker } from './weddingFilm';
import { PHOTO_THEME } from './photoTheme';

/** 無對應婚宴影片的相簿章節（精選／形象照等） */
const GALLERY_ONLY_STAGES: Record<
  string,
  { accent: string; navTime: string; label: string; description: string }
> = {
  couple_portraits: {
    accent: '#b08a6a',
    navTime: '精選',
    label: '新人形象照',
    description: '新人形象寫真精選 ✨',
  },
};

export function stageHasFilm(stageId: string): boolean {
  return Boolean(getStageFilmMarker(stageId));
}

export function getStageAccent(stageId: string): string {
  return (
    getStageFilmMarker(stageId)?.accent ??
    GALLERY_ONLY_STAGES[stageId]?.accent ??
    PHOTO_THEME.gold
  );
}

/** 導覽列時間：宴席用 HH:MM；形象照等用「精選」 */
export function getStageNavTime(stageId: string, time: string): string {
  if (time.trim()) return time;
  return GALLERY_ONLY_STAGES[stageId]?.navTime ?? '';
}

export function getStageLabel(stageId: string, title?: string): string {
  if (title) {
    const stripped = title.replace(/^\d{1,2}:\d{2}\s*/, '').trim();
    if (stripped) return stripped;
  }
  return (
    getStageFilmMarker(stageId)?.label ??
    GALLERY_ONLY_STAGES[stageId]?.label ??
    ''
  );
}

export function getStageDescription(stageId: string, description?: string): string {
  return (
    description?.trim() ||
    getStageFilmMarker(stageId)?.description ||
    GALLERY_ONLY_STAGES[stageId]?.description ||
    ''
  );
}

/** 內嵌影片同步用：無影片章節回退到送客段，避免跳到 0:00 */
export function getFilmStageIdForPlayer(stageId: string): string {
  if (stageHasFilm(stageId)) return stageId;
  return 'farewell';
}

export function isGalleryOnlyStage(stageId: string): boolean {
  return stageId in GALLERY_ONLY_STAGES;
}
