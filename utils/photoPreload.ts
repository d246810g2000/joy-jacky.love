import type { WeddingPhoto } from '../types';
import { getBlurUrl, getLightboxDisplayUrl } from './photoUrls';

const loaded = new Set<string>();
const inflight = new Map<string, Promise<void>>();

export const LIGHTBOX_PREFETCH_RADIUS = 2;

export function preloadImageUrl(url: string): Promise<void> {
  if (loaded.has(url)) return Promise.resolve();

  const existing = inflight.get(url);
  if (existing) return existing;

  const promise = new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      loaded.add(url);
      inflight.delete(url);
      resolve();
    };
    img.onerror = () => {
      inflight.delete(url);
      reject(new Error(`Failed to preload ${url}`));
    };
    img.src = url;
  });

  inflight.set(url, promise);
  return promise;
}

export function isImagePreloaded(url: string): boolean {
  return loaded.has(url);
}

export function preloadLightboxPhoto(
  publicId: string,
  viewportWidth: number,
  includeBlur = true
): Promise<void> {
  const tasks: Promise<void>[] = [
    preloadImageUrl(getLightboxDisplayUrl(publicId, viewportWidth)),
  ];
  if (includeBlur) tasks.push(preloadImageUrl(getBlurUrl(publicId)));
  return Promise.all(tasks).then(() => undefined);
}

export function preloadLightboxNeighbors(
  photos: WeddingPhoto[],
  centerIndex: number,
  viewportWidth: number,
  radius = LIGHTBOX_PREFETCH_RADIUS
): void {
  if (centerIndex < 0 || photos.length === 0) return;

  const saveData =
    typeof navigator !== 'undefined' &&
    'connection' in navigator &&
    Boolean((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData);
  const effectiveRadius = saveData ? Math.min(radius, 1) : radius;
  const start = Math.max(0, centerIndex - effectiveRadius);
  const end = Math.min(photos.length, centerIndex + effectiveRadius + 1);

  for (let i = start; i < end; i += 1) {
    const photo = photos[i];
    if (!photo) continue;
    preloadLightboxPhoto(photo.publicId, viewportWidth).catch(() => undefined);
  }
}
