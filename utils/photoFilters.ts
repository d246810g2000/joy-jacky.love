import type { PhotoFilter, WeddingPhoto, WeddingStage } from '../types';
import { GUEST_INDEX } from './guestIndex';

export const EMPTY_FILTER: PhotoFilter = {
  query: '',
  table: null,
  name: null,
  category: null,
  tag: null,
};

export const PHOTO_CATEGORIES = [
  { id: 'all', label: '📸 全部照片', tag: null },
  { id: 'second-entrance', label: '#二進', tag: '二進' },
  { id: 'games', label: '#互動遊戲', tag: '互動遊戲' },
  { id: 'toast', label: '#逐桌敬酒', tag: '敬酒' },
  { id: 'farewell', label: '#送客合照', tag: '送客' },
] as const;

export const POPULAR_TAGS = [
  '#第 5 桌',
  '#第 3 桌',
  '#女方大學同學',
  '#高中同學',
  '#男方公司同事',
];

export function parseTableFromTag(tag: string): number | null {
  const match = tag.match(/第\s*(\d{1,2})\s*桌/);
  return match ? parseInt(match[1], 10) : null;
}

export function parseRelationFromTag(tag: string): string | null {
  const cleaned = tag.replace(/^#/, '').trim();
  if (parseTableFromTag(cleaned)) return null;
  return cleaned || null;
}

export function filterPhotos(stages: WeddingStage[], filter: PhotoFilter): WeddingPhoto[] {
  const all = stages.flatMap((s) => s.photos);
  if (isFilterEmpty(filter)) return all;

  return all.filter((photo) => matchesFilter(photo, filter));
}

export function isFilterEmpty(filter: PhotoFilter): boolean {
  return (
    !filter.query.trim() &&
    filter.table == null &&
    !filter.name &&
    !filter.category &&
    !filter.tag
  );
}

function matchesFilter(photo: WeddingPhoto, filter: PhotoFilter): boolean {
  if (filter.table != null && !photo.tables.includes(filter.table)) return false;

  if (filter.name) {
    const nameLower = filter.name.toLowerCase();
    const inNames = photo.names.some((n) => n.toLowerCase().includes(nameLower));
    if (!inNames) {
      const guestMatches = GUEST_INDEX.guests.some(
        (g) =>
          g.name.toLowerCase().includes(nameLower) &&
          (g.table == null || photo.tables.includes(g.table))
      );
      if (!guestMatches) return false;
    }
  }

  if (filter.category && filter.category !== 'all') {
    const cat = PHOTO_CATEGORIES.find((c) => c.id === filter.category);
    if (cat?.tag && !photo.tags.some((t) => t.includes(cat.tag!))) return false;
  }

  if (filter.tag) {
    const tableFromTag = parseTableFromTag(filter.tag);
    if (tableFromTag != null) {
      if (!photo.tables.includes(tableFromTag)) return false;
    } else {
      const rel = parseRelationFromTag(filter.tag);
      const tagNorm = (filter.tag.startsWith('#') ? filter.tag.slice(1) : filter.tag).toLowerCase();
      const tagHit =
        photo.tags.some((t) => t.toLowerCase().includes(tagNorm)) ||
        (rel &&
          GUEST_INDEX.guests.some(
            (g) =>
              g.table != null &&
              photo.tables.includes(g.table) &&
              (g.relation.includes(rel) || g.side.includes(rel))
          ));
      if (!tagHit) return false;
    }
  }

  if (filter.query.trim()) {
    const q = filter.query.trim().toLowerCase();
    const tableNum = parseInt(q, 10);
    const tableMatch = !Number.isNaN(tableNum) && photo.tables.includes(tableNum);
    const textBlob = [
      photo.caption,
      photo.time,
      ...photo.tags,
      ...photo.names,
      ...photo.tables.map((t) => `第${t}桌`),
    ]
      .join(' ')
      .toLowerCase();

    const guestMatch = GUEST_INDEX.guests.some(
      (g) =>
        (g.name.toLowerCase().includes(q) ||
          g.relation.toLowerCase().includes(q) ||
          g.side.toLowerCase().includes(q)) &&
        (g.table == null || photo.tables.includes(g.table))
    );

    if (!tableMatch && !textBlob.includes(q) && !guestMatch) return false;
  }

  return true;
}

export function filterLabel(filter: PhotoFilter): string | null {
  if (filter.name) return `「${filter.name}」的照片`;
  if (filter.table != null) return `第 ${filter.table} 桌的照片`;
  if (filter.tag) return filter.tag.startsWith('#') ? filter.tag : `#${filter.tag}`;
  if (filter.category && filter.category !== 'all') {
    return PHOTO_CATEGORIES.find((c) => c.id === filter.category)?.label ?? null;
  }
  if (filter.query.trim()) return `搜尋「${filter.query.trim()}」`;
  return null;
}
