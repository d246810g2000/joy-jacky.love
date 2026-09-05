const CLOUD_NAME = 'djqnqxzha';

const withExt = (id: string) => (id.includes('.') ? id : `${id}.jpg`);

const buildUrl = (publicId: string, transforms: string) =>
  `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transforms}/${withExt(publicId)}`;

/** 時間軸網格縮圖 */
export const getGridUrl = (publicId: string, width = 800) =>
  buildUrl(publicId, `f_auto,q_auto,w_${width}`);

/** Blur 占位（LQIP） */
export const getBlurUrl = (publicId: string) =>
  buildUrl(publicId, 'e_blur:300,w_40,q_auto,f_auto');

/** Filmstrip 小縮圖 */
export const getThumbUrl = (publicId: string, width = 96) =>
  buildUrl(publicId, `f_auto,q_auto,w_${width},h_${width},c_fill`);

/** 燈箱高清大圖 */
export const getLightboxUrl = (publicId: string) =>
  buildUrl(publicId, 'f_auto,q_auto');

/** 原檔下載 */
export const getOriginalUrl = (publicId: string) =>
  buildUrl(publicId, '');

/** 響應式 grid srcSet */
export const getGridSrcSet = (publicId: string) =>
  [400, 600, 800]
    .map((w) => `${getGridUrl(publicId, w)} ${w}w`)
    .join(', ');

export const GRID_SIZES = '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw';

export const getResponsiveGridWidth = (viewportWidth: number) => {
  if (viewportWidth < 640) return 400;
  if (viewportWidth < 1024) return 600;
  return 800;
};

/** 預載相鄰照片：先 thumb 再 lightbox */
export function prefetchPhoto(publicId: string) {
  const thumb = new Image();
  thumb.src = getThumbUrl(publicId);
  const full = new Image();
  full.src = getLightboxUrl(publicId);
}
