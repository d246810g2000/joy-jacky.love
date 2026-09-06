export interface GuestRecord {
  id: number;
  name: string;
  headcount: number | null;
  side: string;
  relation: string;
  table: number | null;
  tableLabel: string;
}

export interface WeddingPhoto {
  id: string;
  publicId: string;
  time: string;
  /** YouTube 影片時間 MM:SS（內部對照，可選） */
  videoTime?: string;
  caption: string;
  tables: number[];
  tags: string[];
  names: string[];
  stageId: string;
  orientation?: 'landscape' | 'portrait';
}

export interface WeddingStage {
  id: string;
  time: string;
  title: string;
  description?: string;
  photos: WeddingPhoto[];
}

/** 姓名搜尋範圍：本人與眷屬，或再擴大到同桌賓客照片 */
export type NameSearchScope = 'person' | 'table';

export interface PhotoFilter {
  query: string;
  table: number | null;
  name: string | null;
  nameScope: NameSearchScope;
  category: string | null;
  tag: string | null;
}

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
