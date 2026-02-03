import type { Photo } from './types';

// 四種相簿版面：1 張直式 / 2 張橫式上下 / 上 1 橫下 2 直左右 / 4 張直式格狀
export type AlbumLayoutType =
  | 'single-portrait'   // 1 張直式
  | 'two-horizontal'    // 2 張橫式上下
  | 'one-h-two-v'       // 上 1 橫、下 2 直左右
  | 'four-portrait-grid'; // 4 張直式格狀

export const PHOTOS_PER_LAYOUT: Record<AlbumLayoutType, number> = {
  'single-portrait': 1,
  'two-horizontal': 2,
  'one-h-two-v': 3,
  'four-portrait-grid': 4,
};

const LAYOUT_TYPES: AlbumLayoutType[] = [
  'single-portrait',
  'two-horizontal',
  'one-h-two-v',
  'four-portrait-grid',
];

/** 簡易 seeded RNG（Mulberry32），確保每次載入版面順序一致 */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SEED = 20260204; // 固定種子，版面順序不變

/**
 * 產生指定數量的版面類型序列，隨機穿插四種格式
 */
export function getLayoutSequence(count: number): AlbumLayoutType[] {
  const rng = mulberry32(SEED);
  const result: AlbumLayoutType[] = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(rng() * LAYOUT_TYPES.length);
    result.push(LAYOUT_TYPES[idx]);
  }
  return result;
}

export interface AlbumPage {
  layout: AlbumLayoutType;
  photos: Photo[];
}

/** 依 publicId 的 -v- / -h- 已對應到 Photo.orientation，此處依版面需求從直式/橫式池取照 */
const LAYOUT_NEEDS: Record<AlbumLayoutType, ('portrait' | 'landscape')[]> = {
  'single-portrait': ['portrait'],
  'two-horizontal': ['landscape', 'landscape'],
  'one-h-two-v': ['landscape', 'portrait', 'portrait'],
  'four-portrait-grid': ['portrait', 'portrait', 'portrait', 'portrait'],
};

/**
 * 依版面序列將照片分頁：依 orientation（publicId 的 v=直式、h=橫式）放入對應版面，
 * 直式照進單直/上橫下兩直/四格，橫式照進兩橫/上橫下兩直，不足時從該池循環使用。
 */
export function partitionPhotosByLayouts(
  photos: Photo[],
  layoutSequence: AlbumLayoutType[]
): AlbumPage[] {
  if (photos.length === 0) return [];
  const portrait = photos.filter((p) => p.orientation === 'portrait');
  const landscape = photos.filter((p) => p.orientation === 'landscape');
  let iPortrait = 0;
  let iLandscape = 0;

  function next(orientation: 'portrait' | 'landscape'): Photo {
    const pool = orientation === 'portrait' ? portrait : landscape;
    const idx = orientation === 'portrait' ? iPortrait++ : iLandscape++;
    return pool[idx % Math.max(1, pool.length)];
  }

  return layoutSequence.map((layout) => {
    const needs = LAYOUT_NEEDS[layout];
    const pagePhotos = needs.map((orient) => next(orient));
    return { layout, photos: pagePhotos };
  });
}
