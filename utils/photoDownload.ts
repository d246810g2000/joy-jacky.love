import type { WeddingPhoto } from '../types';
import { getOriginalUrl } from './photoUrls';

export interface DownloadProgress {
  done: number;
  total: number;
}

const CONFIRM_THRESHOLD = 25;

export function sanitizeDownloadName(name: string): string {
  return name.replace(/[<>:"/\\|?*\n\r]/g, '_').trim().slice(0, 72) || 'wedding-photos';
}

export function shouldConfirmBulkDownload(count: number): boolean {
  return count > CONFIRM_THRESHOLD;
}

function photoFileName(photo: WeddingPhoto): string {
  const time = photo.time.replace(':', '');
  return `${time}_${photo.id}.jpg`;
}

async function fetchPhotoBlob(photo: WeddingPhoto): Promise<Blob> {
  const res = await fetch(getOriginalUrl(photo.publicId));
  if (!res.ok) {
    throw new Error(`無法取得照片 ${photo.id}`);
  }
  return res.blob();
}

export async function downloadPhotosAsZip(
  photos: WeddingPhoto[],
  zipBaseName: string,
  onProgress?: (progress: DownloadProgress) => void
): Promise<void> {
  if (photos.length === 0) return;

  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  const folderName = sanitizeDownloadName(zipBaseName);
  const folder = zip.folder(folderName) ?? zip;

  for (let i = 0; i < photos.length; i += 1) {
    const photo = photos[i];
    onProgress?.({ done: i, total: photos.length });
    const blob = await fetchPhotoBlob(photo);
    folder.file(photoFileName(photo), blob);
  }

  onProgress?.({ done: photos.length, total: photos.length });

  const content = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const url = URL.createObjectURL(content);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${folderName}.zip`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
