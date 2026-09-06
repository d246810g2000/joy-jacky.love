import { useEffect, useState } from 'react';
import type { WeddingPhoto, WeddingStage } from '../types';

export interface WeddingPhotosData {
  WEDDING_STAGES: WeddingStage[];
  ALL_WEDDING_PHOTOS: WeddingPhoto[];
  HERO_COVER_PUBLIC_ID: string;
  HERO_COVER_PUBLIC_IDS: readonly string[];
}

export function useWeddingPhotos() {
  const [data, setData] = useState<WeddingPhotosData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    import('../data/weddingPhotos')
      .then((mod) => {
        if (cancelled) return;
        setData({
          WEDDING_STAGES: mod.WEDDING_STAGES,
          ALL_WEDDING_PHOTOS: mod.ALL_WEDDING_PHOTOS,
          HERO_COVER_PUBLIC_ID: mod.HERO_COVER_PUBLIC_ID,
          HERO_COVER_PUBLIC_IDS: mod.HERO_COVER_PUBLIC_IDS,
        });
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}
