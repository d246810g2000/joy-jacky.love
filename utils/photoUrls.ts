const CLOUD_NAME = 'djqnqxzha';

const withExt = (id: string) => (id.includes('.') ? id : `${id}.jpg`);

const buildUrl = (publicId: string, transforms: string) =>
  `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transforms}/${withExt(publicId)}`;

/** 時間軸網格縮圖 — q_auto:eco 節省流量 */
export const getGridUrl = (publicId: string, width = 800) =>
  buildUrl(publicId, `f_auto,q_auto:eco,w_${width}`);

/** Blur 占位（LQIP） */
export const getBlurUrl = (publicId: string) =>
  buildUrl(publicId, 'e_blur:300,w_40,q_auto:eco,f_auto');

/** Filmstrip 小縮圖 */
export const getThumbUrl = (publicId: string, width = 96) =>
  buildUrl(publicId, `f_auto,q_auto:eco,w_${width},h_${width},c_fill`);

/** 燈箱初始畫面 — 足夠清晰，但不先下載放大用的大檔案 */
export function getLightboxDisplayUrl(publicId: string, viewportWidth = 1200): string {
  const width =
    viewportWidth < 640 ? 1280 : viewportWidth < 1024 ? 1600 : viewportWidth < 1536 ? 1920 : 2560;
  return buildUrl(publicId, `f_auto,q_auto:good,w_${width},c_limit`);
}

/** 燈箱放大畫面 — 只有使用者放大時才載入，避免初始流量過大 */
export function getLightboxZoomUrl(publicId: string, viewportWidth = 1200): string {
  const width = viewportWidth < 640 ? 1920 : viewportWidth < 1024 ? 2560 : 2880;
  return buildUrl(publicId, `f_auto,q_auto:good,w_${width},c_limit`);
}

/** @deprecated 請改用 getLightboxDisplayUrl */
export const getLightboxUrl = (publicId: string, viewportWidth?: number) =>
  getLightboxDisplayUrl(publicId, viewportWidth);

/** Hero 封面 — 單張大圖，略高於燈箱上限 */
export const getHeroCoverUrl = (publicId: string) =>
  buildUrl(publicId, 'f_auto,q_auto:good,w_1920,c_limit');

/** 原檔下載 — 僅在使用者按下載時使用 */
export const getOriginalUrl = (publicId: string) => buildUrl(publicId, '');

/** 響應式 grid srcSet */
export const getGridSrcSet = (publicId: string) =>
  [400, 600, 800].map((w) => `${getGridUrl(publicId, w)} ${w}w`).join(', ');

export const GRID_SIZES = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw';

export const getResponsiveGridWidth = (viewportWidth: number) => {
  if (viewportWidth < 640) return 400;
  if (viewportWidth < 1024) return 600;
  return 800;
};
