import type { PhotoFilter, WeddingPhoto } from '../types';
import {
  companionNamesForQuery,
  guestMatchesRelationQuery,
  hostNameFromCompanionLabel,
  isRelationOrSideQuery,
  parseRelationFromTag,
  parseTableFromTag,
} from './photoFilters';
import { GUEST_INDEX } from './guestIndex';

function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '');
}

function isCompanionOf(label: string, host: string): boolean {
  const hostKey = normalizeKey(host);
  const labelKey = normalizeKey(label);
  if (!hostKey || !labelKey.startsWith(hostKey)) return false;
  return /^眷\d*$/.test(labelKey.slice(hostKey.length));
}

/** 姓名與目前篩選的相關分數（越高越應排前面） */
export function photoNameMatchScore(name: string, filter?: PhotoFilter | null): number {
  if (!filter) return 0;
  const nameLower = name.toLowerCase();

  if (filter.name) {
    const q = filter.name.trim().toLowerCase();
    if (!q) return 0;
    if (nameLower === q || nameLower.includes(q) || q.includes(nameLower)) return 3;
    if (isCompanionOf(name, filter.name)) return 3;
    const host = hostNameFromCompanionLabel(name);
    if (host && host.toLowerCase() === q) return 3;
    const companions = companionNamesForQuery(filter.name);
    if (companions.some((c) => normalizeKey(c) === normalizeKey(name))) return 3;
  }

  if (filter.tag) {
    const rel = parseRelationFromTag(filter.tag);
    if (rel && isRelationOrSideQuery(rel)) {
      const hit = GUEST_INDEX.guests.some(
        (guest) =>
          guestMatchesRelationQuery(guest, rel) &&
          (nameLower.includes(guest.name.toLowerCase()) ||
            isCompanionOf(name, guest.name) ||
            companionNamesForQuery(guest.name).some((c) => normalizeKey(c) === normalizeKey(name)))
      );
      if (hit) return 2;
    }
  }

  if (filter.query.trim() && !filter.name) {
    const q = filter.query.trim().toLowerCase();
    if (nameLower.includes(q)) return 1;
  }

  return 0;
}

/** 桌次與目前篩選的相關分數 */
export function photoTableMatchScore(table: number, filter?: PhotoFilter | null): number {
  if (!filter) return 0;
  if (filter.table != null && table === filter.table) return 3;

  if (filter.tag) {
    const fromTag = parseTableFromTag(filter.tag);
    if (fromTag != null && fromTag === table) return 3;

    const rel = parseRelationFromTag(filter.tag);
    if (rel && isRelationOrSideQuery(rel)) {
      const hit = GUEST_INDEX.guests.some(
        (guest) => guestMatchesRelationQuery(guest, rel) && guest.table === table
      );
      if (hit) return 2;
    }
  }

  if (filter.name) {
    const guest = GUEST_INDEX.guests.find(
      (g) => g.name.toLowerCase() === filter.name!.trim().toLowerCase()
    );
    if (guest?.table === table) return 1;
  }

  return 0;
}

function stablePrioritize<T>(items: T[], scoreOf: (item: T) => number): T[] {
  return items
    .map((item, index) => ({ item, index, score: scoreOf(item) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.item);
}

export function prioritizePhotoNames(
  names: string[],
  filter?: PhotoFilter | null
): string[] {
  if (!filter || names.length < 2) return names;
  return stablePrioritize(names, (name) => photoNameMatchScore(name, filter));
}

export function prioritizePhotoTables(
  tables: number[],
  filter?: PhotoFilter | null
): number[] {
  if (!filter || tables.length < 2) return tables;
  return stablePrioritize(tables, (table) => photoTableMatchScore(table, filter));
}

export function getPrioritizedPhotoMeta(
  photo: WeddingPhoto,
  filter?: PhotoFilter | null
): { names: string[]; tables: number[] } {
  return {
    names: prioritizePhotoNames(photo.names, filter),
    tables: prioritizePhotoTables(photo.tables, filter),
  };
}
