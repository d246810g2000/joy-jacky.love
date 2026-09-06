import type { WeddingPhoto } from '../types';
import { getDownloadUrl, type PhotoDownloadQuality } from './photoUrls';

export interface DownloadProgress {
  done: number;
  total: number;
  /** 目前處理到第幾包（多分卷／多輪分享時） */
  part?: number;
  parts?: number;
  phase?: 'fetch' | 'zip' | 'share' | 'save';
  /** zip = 電腦打包；share = 手機分享存相簿 */
  mode?: 'zip' | 'share';
}

export type { PhotoDownloadQuality };

/** 超過此張數先確認 */
const CONFIRM_THRESHOLD = 20;
/** 單包 zip 張數上限，避免記憶體爆掉、瀏覽器擋多檔 */
const ZIP_CHUNK_SIZE = 36;
/** 手機一次分享張數（過大會被系統拒或 OOM） */
const SHARE_BATCH_SIZE = 8;
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

/** 手機超過一批分享張數時先說明會跳出多次選單 */
export function shouldConfirmMobileShare(count: number): boolean {
  return count > SHARE_BATCH_SIZE;
}

/** 手機／平板：優先用系統分享把圖存進「照片」 */
export function isLikelyMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod|Android/i.test(ua)) return true;
  // iPadOS 桌面 UA：靠觸控點判斷
  return navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua);
}

export function shouldPreferMobilePhotoShare(): boolean {
  return (
    isLikelyMobileDevice() &&
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function'
  );
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
  quality: PhotoDownloadQuality = 'share',
  mode: 'zip' | 'share' = 'zip'
): string {
  const mb = estimateDownloadMb(count, quality);
  const qualityLabel =
    quality === 'original' ? '相機原檔' : quality === 'print' ? '高畫質大圖' : '精選高清檔';

  if (mode === 'share') {
    const batches = Math.ceil(count / SHARE_BATCH_SIZE);
    const batchHint =
      batches > 1
        ? `\n會分 ${batches} 次跳出分享選單，請每次選「儲存影像」存到相簿。`
        : `\n接著會跳出分享選單，請選「儲存影像」存到相簿。`;
    return (
      `即將準備 ${count} 張「${qualityLabel}」（約 ${mb} MB）${batchHint}\n\n` +
      `確定繼續嗎？`
    );
  }

  const parts = Math.ceil(count / ZIP_CHUNK_SIZE);
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

function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError';
}

function blobToImageFile(blob: Blob, filename: string): File {
  const type = blob.type && blob.type.startsWith('image/') ? blob.type : 'image/jpeg';
  return new File([blob], filename, { type });
}

function canShareImageFiles(files: File[]): boolean {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return false;
  if (typeof navigator.canShare !== 'function') {
    // 舊版可能有 share 但沒 canShare；仍嘗試單檔
    return files.length === 1;
  }
  try {
    return navigator.canShare({ files });
  } catch {
    return false;
  }
}

async function shareImageFiles(files: File[], title: string): Promise<'shared' | 'cancelled'> {
  try {
    await navigator.share({ files, title });
    return 'shared';
  } catch (err) {
    if (isAbortError(err)) return 'cancelled';
    throw err;
  }
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
  /** 強制 zip / share；預設依裝置自動選 */
  mode?: 'zip' | 'share' | 'auto';
}

/**
 * 手機批次：拉檔後用系統分享選單，方便「儲存影像」進相簿。
 * 若系統不支援多檔分享，則退回單張依序分享；再不行才 zip。
 */
async function downloadPhotosViaShare(
  photos: WeddingPhoto[],
  zipBaseName: string,
  quality: PhotoDownloadQuality,
  signal: AbortSignal | undefined,
  onProgress: ((progress: DownloadProgress) => void) | undefined
): Promise<void> {
  const total = photos.length;
  const folderName = sanitizeDownloadName(zipBaseName);
  const parts = Math.ceil(total / SHARE_BATCH_SIZE);
  let completedGlobal = 0;
  let sharedAny = false;

  for (let partIndex = 0; partIndex < parts; partIndex += 1) {
    if (signal?.aborted) throw new DOMException('下載已取消', 'AbortError');

    const start = partIndex * SHARE_BATCH_SIZE;
    const chunk = photos.slice(start, start + SHARE_BATCH_SIZE);

    onProgress?.({
      done: completedGlobal,
      total,
      part: partIndex + 1,
      parts,
      phase: 'fetch',
      mode: 'share',
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
          mode: 'share',
        });
      }
    );

    const files = blobs.map(({ photo, blob }) =>
      blobToImageFile(blob, photoFileName(photo))
    );

    onProgress?.({
      done: completedGlobal + chunk.length,
      total,
      part: partIndex + 1,
      parts,
      phase: 'share',
      mode: 'share',
    });

    let sharedThisBatch = false;

    if (canShareImageFiles(files)) {
      const result = await shareImageFiles(files, folderName);
      if (result === 'cancelled') {
        if (!sharedAny) throw new DOMException('下載已取消', 'AbortError');
        return;
      }
      sharedThisBatch = true;
      sharedAny = true;
    } else {
      // 逐張分享（部分 Android／舊 iOS 不接受多檔）
      for (const file of files) {
        if (signal?.aborted) throw new DOMException('下載已取消', 'AbortError');
        if (!canShareImageFiles([file])) {
          // 完全無法 share：這一批改走下載
          for (const { blob, photo } of blobs) {
            triggerBlobDownload(blob, photoFileName(photo));
            await sleep(350);
          }
          sharedThisBatch = true;
          sharedAny = true;
          break;
        }
        const result = await shareImageFiles([file], folderName);
        if (result === 'cancelled') {
          if (!sharedAny) throw new DOMException('下載已取消', 'AbortError');
          return;
        }
        sharedThisBatch = true;
        sharedAny = true;
      }
    }

    completedGlobal += chunk.length;

    onProgress?.({
      done: completedGlobal,
      total,
      part: partIndex + 1,
      parts,
      phase: 'save',
      mode: 'share',
    });

    if (!sharedThisBatch) {
      // 最後手段：整批 zip
      const zipBlob = await zipPhotoBlobs(blobs, folderName);
      triggerBlobDownload(zipBlob, `${folderName}_第${partIndex + 1}包.zip`);
    }

    // 給系統一點時間關閉選單，避免連續 share 被擋
    if (partIndex < parts - 1) await sleep(400);
  }
}

/**
 * 將篩選結果打包下載。
 * - 桌機：zip
 * - 手機：系統分享 → 存進「照片」
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
  const mode =
    options.mode === 'zip' || options.mode === 'share'
      ? options.mode
      : shouldPreferMobilePhotoShare()
        ? 'share'
        : 'zip';

  if (mode === 'share') {
    try {
      await downloadPhotosViaShare(photos, zipBaseName, quality, signal, onProgress);
      return;
    } catch (err) {
      if (isAbortError(err)) throw err;
      // share 失敗時退回 zip，避免賓客完全拿不到檔
      console.warn('[photoDownload] mobile share failed, falling back to zip', err);
    }
  }

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
      mode: 'zip',
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
          mode: 'zip',
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
      mode: 'zip',
    });

    const zipBlob = await zipPhotoBlobs(blobs, folderName, (ratio) => {
      onProgress?.({
        done: completedGlobal,
        total,
        part: partIndex + 1,
        parts,
        phase: 'zip',
        mode: 'zip',
      });
      void ratio;
    });

    onProgress?.({
      done: completedGlobal,
      total,
      part: partIndex + 1,
      parts,
      phase: 'save',
      mode: 'zip',
    });

    const suffix = parts > 1 ? `_第${partIndex + 1}包共${parts}包` : '';
    triggerBlobDownload(zipBlob, `${folderName}${suffix}.zip`);

    // 讓瀏覽器有時間開始下載，避免連續 click 被擋
    if (partIndex < parts - 1) await sleep(900);
  }
}

/**
 * 單張下載／儲存。
 * 手機優先開系統分享選單（可選「儲存影像」進相簿）；否則走檔案下載。
 */
export async function downloadSinglePhoto(
  photo: WeddingPhoto,
  quality: PhotoDownloadQuality = 'print'
): Promise<void> {
  const blob = await fetchPhotoBlob(photo, quality);
  const filename = photoFileName(photo);
  const file = blobToImageFile(blob, filename);

  if (canShareImageFiles([file])) {
    try {
      await shareImageFiles([file], '婚禮照片');
      return;
    } catch {
      // 分享失敗再退回一般下載
    }
  }

  triggerBlobDownload(blob, filename);
}
