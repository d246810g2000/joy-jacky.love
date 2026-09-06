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

/** 搜尋姓名頭像 — 由 Cloudinary 自動裁切臉部 */
export const getFaceAvatarUrl = (publicId: string, size = 160) =>
  buildUrl(publicId, `f_auto,q_auto:good,w_${size},h_${size},c_fill,g_face`);

const LIGHTBOX_WIDTH_STEPS = [1280, 1600, 1920, 2048, 2560, 2880, 3200, 3840, 4096] as const;
const LIGHTBOX_DISPLAY_MAX = 3840;
const LIGHTBOX_ZOOM_MAX = 4096;

function resolveDevicePixelRatio(dpr?: number): number {
  const raw =
    dpr ??
    (typeof window !== 'undefined' && Number.isFinite(window.devicePixelRatio)
      ? window.devicePixelRatio
      : 1);
  // Cap at 3× to avoid absurd downloads on high-DPI phones
  return Math.min(Math.max(raw || 1, 1), 3);
}

function snapLightboxWidth(targetPx: number, max: number): number {
  const capped = Math.min(Math.max(Math.ceil(targetPx), LIGHTBOX_WIDTH_STEPS[0]), max);
  for (const step of LIGHTBOX_WIDTH_STEPS) {
    if (step >= capped) return Math.min(step, max);
  }
  return max;
}

/** 燈箱初始圖寬：CSS 視窗寬 × devicePixelRatio，再對齊 Cloudinary 階梯 */
export function getLightboxDisplayWidth(viewportWidth = 1200, dpr?: number): number {
  return snapLightboxWidth(viewportWidth * resolveDevicePixelRatio(dpr), LIGHTBOX_DISPLAY_MAX);
}

/** 燈箱放大圖寬：在螢幕像素基礎上再留餘裕 */
export function getLightboxZoomWidth(viewportWidth = 1200, dpr?: number): number {
  return snapLightboxWidth(
    viewportWidth * resolveDevicePixelRatio(dpr) * 1.5,
    LIGHTBOX_ZOOM_MAX
  );
}

/** 燈箱初始畫面 — 依螢幕實體像素選寬，Retina 不會偏軟 */
export function getLightboxDisplayUrl(
  publicId: string,
  viewportWidth = 1200,
  dpr?: number
): string {
  const width = getLightboxDisplayWidth(viewportWidth, dpr);
  return buildUrl(publicId, `f_auto,q_auto:good,w_${width},c_limit`);
}

/** 燈箱放大畫面 — 只有使用者放大時才載入，避免初始流量過大 */
export function getLightboxZoomUrl(
  publicId: string,
  viewportWidth = 1200,
  dpr?: number
): string {
  const width = getLightboxZoomWidth(viewportWidth, dpr);
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
