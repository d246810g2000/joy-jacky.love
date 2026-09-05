/** 婚禮相簿視覺 token — 與 index.html CSS variables 對應 */
export const PHOTO_THEME = {
  gold: '#B08D55',
  goldLight: '#e6c896',
  goldDark: '#8B6F3E',
  bg: '#0c0b0a',
  ink: '#f5f0e8',
  tagline: '重溫這一天的每個瞬間',
  lightboxMotto: '這一刻，我們都記得',
} as const;

export const FILM_EXPANDED_KEY = 'photo_film_expanded';

export function readFilmExpanded(): boolean {
  try {
    return sessionStorage.getItem(FILM_EXPANDED_KEY) === '1';
  } catch {
    return false;
  }
}

export function writeFilmExpanded(expanded: boolean): void {
  try {
    sessionStorage.setItem(FILM_EXPANDED_KEY, expanded ? '1' : '0');
  } catch {
    /* ignore */
  }
}

export function chapterLabel(index: number, stageLabel: string): string {
  const ordinals = ['一', '二', '三', '四', '五', '六', '七', '八'];
  const n = ordinals[index] ?? String(index + 1);
  return `第${n}章 · ${stageLabel}`;
}
