import { useCallback, useRef, useState } from 'react';
import type { WeddingPhoto } from '../types';
import {
  buildBulkDownloadConfirmMessage,
  downloadPhotosAsZip,
  sanitizeDownloadName,
  shouldConfirmBulkDownload,
  type DownloadProgress,
  type PhotoDownloadQuality,
} from '../utils/photoDownload';

export function usePhotoBulkDownload() {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const downloadAll = useCallback(
    async (
      photos: WeddingPhoto[],
      label: string,
      quality: PhotoDownloadQuality = 'share'
    ) => {
      if (downloading || photos.length === 0) return;

      if (shouldConfirmBulkDownload(photos.length)) {
        const ok = window.confirm(buildBulkDownloadConfirmMessage(photos.length, quality));
        if (!ok) return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setDownloading(true);
      setError(null);
      setProgress({ done: 0, total: photos.length, phase: 'fetch' });

      try {
        await downloadPhotosAsZip(photos, sanitizeDownloadName(label), {
          quality,
          signal: controller.signal,
          onProgress: setProgress,
        });
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          setError('下載已取消');
        } else {
          const message = err instanceof Error ? err.message : '下載失敗，請稍後再試';
          setError(
            `${message}。若張數很多，可再縮小搜尋範圍後重試；網路不穩時稍候再下載。`
          );
        }
      } finally {
        setDownloading(false);
        setProgress(null);
        if (abortRef.current === controller) abortRef.current = null;
      }
    },
    [downloading]
  );

  const cancelDownload = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { downloading, progress, error, downloadAll, cancelDownload, clearError };
}
