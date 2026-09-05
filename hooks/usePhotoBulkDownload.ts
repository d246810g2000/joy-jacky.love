import { useCallback, useState } from 'react';
import type { WeddingPhoto } from '../types';
import {
  downloadPhotosAsZip,
  sanitizeDownloadName,
  shouldConfirmBulkDownload,
  type DownloadProgress,
} from '../utils/photoDownload';

export function usePhotoBulkDownload() {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const downloadAll = useCallback(async (photos: WeddingPhoto[], label: string) => {
    if (downloading || photos.length === 0) return;

    if (shouldConfirmBulkDownload(photos.length)) {
      const ok = window.confirm(
        `即將打包下載 ${photos.length} 張原檔照片，檔案可能較大且需要一些時間，確定繼續嗎？`
      );
      if (!ok) return;
    }

    setDownloading(true);
    setError(null);
    setProgress({ done: 0, total: photos.length });

    try {
      await downloadPhotosAsZip(photos, sanitizeDownloadName(label), setProgress);
    } catch (err) {
      const message = err instanceof Error ? err.message : '下載失敗，請稍後再試';
      setError(message);
    } finally {
      setDownloading(false);
      setProgress(null);
    }
  }, [downloading]);

  const clearError = useCallback(() => setError(null), []);

  return { downloading, progress, error, downloadAll, clearError };
}
