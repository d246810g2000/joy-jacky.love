
export interface Photo {
  id: string;
  url: string;
  /** 壓縮圖 URL（相簿網格、飛出照片用）；點進藝廊用 url 高清 */
  compressedUrl?: string;
  alt: string;
  /** 精彩瞬間標題 */
  title?: string;
  /** 視覺與心情註解 */
  description?: string;
  /** 地點 (Location) */
  location?: string;
  /** 國家／地區，用於藝廊顯示 */
  country?: string;
  rotation?: number;
  orientation?: 'landscape' | 'portrait';
}

export interface SectionProps {
  className?: string;
}

export interface GuestBookEntry {
  id: string;
  name: string;
  message: string;
  timestamp: number;
  photo?: string; // Base64 string
  likes: number; // Number of likes
  isLiked: boolean; // Whether the current user has liked it
}
