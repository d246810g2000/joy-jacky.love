
export interface Photo {
  id: string;
  url: string;
  alt: string;
  description?: string;
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
