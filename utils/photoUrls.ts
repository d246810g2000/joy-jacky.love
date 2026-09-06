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

/** 正規化臉框（相對整張圖 0–1） */
export type FaceBoxNorm = {
  x: number;
  y: number;
  w: number;
  h: number;
};

/** 把臉框擴成正方形頭像裁切區（pad > 1 會留一點額頭／下巴） */
function faceBoxToSquareCrop(face: FaceBoxNorm, pad = 1.65) {
  const side = Math.min(1, Math.max(face.w, face.h) * pad);
  const cx = face.x + face.w / 2;
  const cy = face.y + face.h / 2;
  const x = Math.max(0, Math.min(cx - side / 2, 1 - side));
  const y = Math.max(0, Math.min(cy - side / 2, 1 - side));
  const r = (n: number) => (Math.round(n * 1000) / 1000).toFixed(3);
  return { x: r(x), y: r(y), side: r(side) };
}

/**
 * 搜尋姓名頭像。
 * 有 face 時依標記座標緊裁；否則退回 Cloudinary g_face（較鬆）。
 */
export const getFaceAvatarUrl = (
  publicId: string,
  size = 160,
  face?: FaceBoxNorm | null
) => {
  if (face && face.w > 0 && face.h > 0) {
    const { x, y, side } = faceBoxToSquareCrop(face);
    return buildUrl(
      publicId,
      `c_crop,w_${side},h_${side},x_${x},y_${y}/f_auto,q_auto:good,w_${size},h_${size},c_fill`
    );
  }
  return buildUrl(
    publicId,
    `f_auto,q_auto:good,w_${size},h_${size},c_thumb,g_face,z_0.4`
  );
};

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

/** 原檔下載 — 僅在明確需要最高畫質時使用（流量大） */
export const getOriginalUrl = (publicId: string) => buildUrl(publicId, '');

/**
 * 賓客下載用圖檔。
 * - share：手機／社群分享（預設批次下載，約 0.2–0.5MB）
 * - print：大圖沖印／桌布（約 0.6–1.5MB）
 * - original：相機原檔（約 4–8MB，流量與時間成本高）
 */
export type PhotoDownloadQuality = 'share' | 'print' | 'original';

export function getDownloadUrl(
  publicId: string,
  quality: PhotoDownloadQuality = 'share'
): string {
  if (quality === 'original') return getOriginalUrl(publicId);
  if (quality === 'print') {
    return buildUrl(publicId, 'f_jpg,q_auto:good,w_3840,c_limit');
  }
  return buildUrl(publicId, 'f_jpg,q_auto:good,w_2560,c_limit');
}

/** 響應式 grid srcSet */
export const getGridSrcSet = (publicId: string) =>
  [400, 600, 800].map((w) => `${getGridUrl(publicId, w)} ${w}w`).join(', ');

export const GRID_SIZES = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw';

export const getResponsiveGridWidth = (viewportWidth: number) => {
  if (viewportWidth < 640) return 400;
  if (viewportWidth < 1024) return 600;
  return 800;
};
