import type { WeddingPhoto } from '../types';
import { getDownloadUrl, type PhotoDownloadQuality } from './photoUrls';

export interface DownloadProgress {
  done: number;
  total: number;
  /** 目前處理到第幾包（多分卷時） */
  part?: number;
  parts?: number;
  phase?: 'fetch' | 'zip' | 'save';
}

export type { PhotoDownloadQuality };

/** 超過此張數先確認 */
const CONFIRM_THRESHOLD = 20;
/** 單包 zip 張數上限，避免記憶體爆掉、瀏覽器擋多檔 */
const ZIP_CHUNK_SIZE = 36;
/** 同時向 Cloudinary 拉檔的併發數（多賓客共用 CDN，不宜太高） */
const FETCH_CONCURRENCY = 3;
/** 預估每張精選檔大小（MB），用於確認文案 */
const EST_SHARE_MB = 0.35;
const EST_PRINT_MB = 1.0;
const EST_ORIGINAL_MB = 5.6;

export function sanitizeDownloadName(name: string): string {
  return name.replace(/[<>:"/\\|?*\n\r]/g, '_').trim().slice(0, 72) || 'wedding-photos';
}

export function shouldConfirmBulkDownload(count: number): boolean {
  return count > CONFIRM_THRESHOLD;
}

export function estimateDownloadMb(
  count: number,
  quality: PhotoDownloadQuality = 'share'
): number {
  const per =
    quality === 'original' ? EST_ORIGINAL_MB : quality === 'print' ? EST_PRINT_MB : EST_SHARE_MB;
  return Math.round(count * per * 10) / 10;
}

export function buildBulkDownloadConfirmMessage(
  count: number,
  quality: PhotoDownloadQuality = 'share'
): string {
  const mb = estimateDownloadMb(count, quality);
  const parts = Math.ceil(count / ZIP_CHUNK_SIZE);
  const qualityLabel =
    quality === 'original' ? '相機原檔' : quality === 'print' ? '高畫質大圖' : '精選高清檔（適合手機分享）';
  const partHint =
    parts > 1 ? `\n檔案會分成 ${parts} 個 zip 依序下載，請允許瀏覽器下載多個檔案。` : '';
  return (
    `即將打包下載 ${count} 張「${qualityLabel}」\n` +
    `預估約 ${mb} MB，約需數十秒到幾分鐘。${partHint}\n\n` +
    `確定繼續嗎？`
  );
}

function photoFileName(photo: WeddingPhoto): string {
  const time = photo.time.replace(':', '') || '0000';
  return `${time}_${photo.id}.jpg`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function fetchPhotoBlob(
  photo: WeddingPhoto,
  quality: PhotoDownloadQuality,
  signal?: AbortSignal
): Promise<Blob> {
  const url = getDownloadUrl(photo.publicId, quality);
  let lastError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const res = await fetch(url, { signal, mode: 'cors' });
      if (res.status === 429 || res.status >= 500) {
        await sleep(400 * (attempt + 1) ** 2);
        continue;
      }
      if (!res.ok) {
        throw new Error(`無法取得照片 ${photo.id}（${res.status}）`);
      }
      return await res.blob();
    } catch (err) {
      lastError = err;
      if (signal?.aborted) throw err;
      if (attempt < 2) await sleep(350 * (attempt + 1));
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`無法取得照片 ${photo.id}`);
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
  onProgress?: (done: number) => void
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  let completed = 0;

  async function runWorker(): Promise<void> {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
      completed += 1;
      onProgress?.(completed);
    }
  }

  const pool = Math.min(Math.max(concurrency, 1), items.length);
  await Promise.all(Array.from({ length: pool }, () => runWorker()));
  return results;
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

async function zipPhotoBlobs(
  entries: { photo: WeddingPhoto; blob: Blob }[],
  folderName: string,
  onZipProgress?: (ratio: number) => void
): Promise<Blob> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  const folder = zip.folder(folderName) ?? zip;

  for (const { photo, blob } of entries) {
    // JPEG 已壓縮，STORE 更快、也較省 CPU
    folder.file(photoFileName(photo), blob, { compression: 'STORE' });
  }

  return zip.generateAsync(
    {
      type: 'blob',
      compression: 'STORE',
      streamFiles: true,
    },
    (meta) => {
      if (meta.percent != null) onZipProgress?.(meta.percent / 100);
    }
  );
}

export interface BulkDownloadOptions {
  quality?: PhotoDownloadQuality;
  signal?: AbortSignal;
  onProgress?: (progress: DownloadProgress) => void;
}

/**
 * 將篩選結果打包下載。
 * - 預設精選高清（大幅降低 Cloudinary 流量與等待時間）
 * - 小併發拉取，多分卷 zip，避免手機記憶體爆掉
 */
export async function downloadPhotosAsZip(
  photos: WeddingPhoto[],
  zipBaseName: string,
  onProgressOrOptions?: ((progress: DownloadProgress) => void) | BulkDownloadOptions
): Promise<void> {
  if (photos.length === 0) return;

  const options: BulkDownloadOptions =
    typeof onProgressOrOptions === 'function'
      ? { onProgress: onProgressOrOptions }
      : onProgressOrOptions ?? {};

  const quality = options.quality ?? 'share';
  const onProgress = options.onProgress;
  const signal = options.signal;
  const folderName = sanitizeDownloadName(zipBaseName);
  const parts = Math.ceil(photos.length / ZIP_CHUNK_SIZE);

  let completedGlobal = 0;
  const total = photos.length;

  for (let partIndex = 0; partIndex < parts; partIndex += 1) {
    if (signal?.aborted) throw new DOMException('下載已取消', 'AbortError');

    const start = partIndex * ZIP_CHUNK_SIZE;
    const chunk = photos.slice(start, start + ZIP_CHUNK_SIZE);

    onProgress?.({
      done: completedGlobal,
      total,
      part: partIndex + 1,
      parts,
      phase: 'fetch',
    });

    const chunkDoneBase = completedGlobal;
    const blobs = await mapPool(
      chunk,
      FETCH_CONCURRENCY,
      async (photo) => {
        const blob = await fetchPhotoBlob(photo, quality, signal);
        return { photo, blob };
      },
      (doneInChunk) => {
        onProgress?.({
          done: chunkDoneBase + doneInChunk,
          total,
          part: partIndex + 1,
          parts,
          phase: 'fetch',
        });
      }
    );

    completedGlobal += chunk.length;
    onProgress?.({
      done: completedGlobal,
      total,
      part: partIndex + 1,
      parts,
      phase: 'zip',
    });

    const zipBlob = await zipPhotoBlobs(blobs, folderName, (ratio) => {
      onProgress?.({
        done: completedGlobal,
        total,
        part: partIndex + 1,
        parts,
        phase: 'zip',
      });
      void ratio;
    });

    onProgress?.({
      done: completedGlobal,
      total,
      part: partIndex + 1,
      parts,
      phase: 'save',
    });

    const suffix = parts > 1 ? `_第${partIndex + 1}包共${parts}包` : '';
    triggerBlobDownload(zipBlob, `${folderName}${suffix}.zip`);

    // 讓瀏覽器有時間開始下載，避免連續 click 被擋
    if (partIndex < parts - 1) await sleep(900);
  }
}

/** 單張下載（燈箱）：拉成 blob 以確保檔名正確，預設精選高清 */
export async function downloadSinglePhoto(
  photo: WeddingPhoto,
  quality: PhotoDownloadQuality = 'print'
): Promise<void> {
  const blob = await fetchPhotoBlob(photo, quality);
  triggerBlobDownload(blob, photoFileName(photo));
}
