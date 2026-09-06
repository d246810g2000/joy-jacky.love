/** 婚宴全紀錄 YouTube — https://www.youtube.com/watch?v=Wkrw24KJhrU */
export const WEDDING_FILM_VIDEO_ID = 'Wkrw24KJhrU';

export interface FilmStageMarker {
  id: string;
  /** YouTube 影片時間 MM:SS */
  filmTime: string;
  /** 婚宴實際時間 HH:MM */
  clockTime: string;
  label: string;
  description: string;
  startSec: number;
  /** 沉浸式區塊氛圍色 */
  accent: string;
}

/** 相簿宴席章節 — 與照片編號分章一致（形象照另章、無對應影片段落） */
export const FILM_STAGE_MARKERS: FilmStageMarker[] = [
  {
    id: 'opening_mermaid',
    filmTime: '00:00',
    clockTime: '11:00',
    label: '溫馨開場',
    description: '真珠美人魚浪漫序幕 🧜‍♀️',
    startSec: 0,
    accent: '#c9a87c',
  },
  {
    id: 'grand_entrance',
    filmTime: '04:37',
    clockTime: '12:10',
    label: '新人進場',
    description: '男女主角璀璨進場｜愛之雨星光燈海 💖',
    startSec: 277,
    accent: '#e6c07a',
  },
  {
    id: 'second_entrance',
    filmTime: '17:31',
    clockTime: '13:40',
    label: '二進驚喜',
    description: '浪漫開唱與熱舞表演 🕺💃',
    startSec: 1051,
    accent: '#e0a86e',
  },
  {
    id: 'interactive_games',
    filmTime: '20:21',
    clockTime: '13:45',
    label: '互動遊戲',
    description: '猜禮服、賓果、快問快答 🎲',
    startSec: 1221,
    accent: '#9a8ed4',
  },
  {
    id: 'table_toast',
    filmTime: '47:35',
    clockTime: '14:10',
    label: '逐桌敬酒',
    description: '溫馨逐桌敬酒 🍷',
    startSec: 2855,
    accent: '#a85858',
  },
  {
    id: 'farewell',
    filmTime: '53:35',
    clockTime: '14:30',
    label: '送客合照',
    description: '幸福送客與合照 📷',
    startSec: 3215,
    accent: '#7a8eb0',
  },
];

const markerById = new Map(FILM_STAGE_MARKERS.map((m) => [m.id, m]));

export function getStageFilmMarker(stageId: string): FilmStageMarker | undefined {
  return markerById.get(stageId);
}

export function getStageFilmStart(stageId: string): number {
  return markerById.get(stageId)?.startSec ?? 0;
}

export function getFilmEmbedUrl(startSec: number): string {
  return `https://www.youtube.com/embed/${WEDDING_FILM_VIDEO_ID}?start=${startSec}&autoplay=1&rel=0&modestbranding=1&playsinline=1`;
}

export function getFilmWatchUrl(startSec = 0): string {
  return `https://www.youtube.com/watch?v=${WEDDING_FILM_VIDEO_ID}&t=${startSec}s`;
}

export function formatFilmTime(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
