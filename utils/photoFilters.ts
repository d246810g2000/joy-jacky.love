import type { GuestRecord, PhotoFilter, WeddingPhoto, WeddingStage } from '../types';
import { COMPANIONS_BY_HOST } from '../data/companionIndex';
import { GUEST_INDEX, GUEST_RECORDS } from './guestIndex';
import { formatTableFilterTitle, formatTableTag } from './tableLabels';

export const EMPTY_FILTER: PhotoFilter = {
  query: '',
  table: null,
  name: null,
  nameScope: 'person',
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

export const POPULAR_TAGS = [formatTableTag(5), formatTableTag(3)];

export const PHOTO_SEARCH_SIDES = [
  { key: '男方' as const, label: '男方親友', relationTitle: '與新郎的關係' },
  { key: '女方' as const, label: '女方親友', relationTitle: '與新娘的關係' },
] as const;

/** 高曝光身分：不進關係 chips，改以姓名搜尋（避免親戚／群組被主家照片淹蓋）。 */
const HIDDEN_RELATION_CHIPS = new Set(['新人', '父母']);

/** 關係群組瀏覽上限：每人最多貢獻幾張；總量超過再做公平抽樣。 */
const RELATION_MAX_PER_GUEST = 8;
const RELATION_SOFT_CAP = 48;

/** 從實際 guest 標籤建立關係選項，保留資料檔中的自訂分類與順序。 */
function uniqueGuestRelations(guests: GuestRecord[]): string[] {
  const relations = new Map<string, string>();
  for (const guest of guests) {
    const relation = guest.relation.trim();
    if (!relation || HIDDEN_RELATION_CHIPS.has(relation)) continue;
    const key = relation.toLocaleLowerCase();
    if (!relations.has(key)) relations.set(key, relation);
  }
  return [...relations.values()];
}

export const GUEST_RELATIONS = uniqueGuestRelations(GUEST_RECORDS);

export function getGuestRelationsForSide(side: SideKey): string[] {
  return uniqueGuestRelations(GUEST_RECORDS.filter((guest) => guest.side.includes(side)));
}

/** @deprecated 改用 PHOTO_SEARCH_SIDES × getGuestRelationsForSide */
export const SIDE_RELATION_TAGS = PHOTO_SEARCH_SIDES.flatMap(({ key }) =>
  getGuestRelationsForSide(key).map((relation) => `#${key}${relation}`)
);

export type SideKey = '男方' | '女方';

export function parseSideRelationQuery(query: string): {
  side: SideKey | null;
  relation: string;
} {
  const q = query.replace(/^#/, '').trim();
  if (!q) return { side: null, relation: '' };

  if (q.startsWith('男方')) {
    return { side: '男方', relation: q.slice(2).trim() };
  }
  if (q.startsWith('女方')) {
    return { side: '女方', relation: q.slice(2).trim() };
  }
  return { side: null, relation: q };
}

export function guestMatchesRelationQuery(guest: GuestRecord, query: string): boolean {
  const { side, relation } = parseSideRelationQuery(query);
  const relQ = relation.toLowerCase();
  const guestSide = guest.side.toLowerCase();
  const guestRelation = guest.relation.toLowerCase();

  if (side && !guestSide.includes(side)) return false;

  if (!relQ) {
    return side ? guestSide.includes(side) : false;
  }

  // 精確比對（避免「同事」與「前同事」互相污染）
  if (guestRelation === relQ) return true;

  // 無側別的泛稱：輸入「同學」可涵蓋高中／大學／碩士同學
  if (!side && relQ === '同學' && guestRelation.endsWith('同學')) return true;

  return false;
}

const GROUP_SEARCH_KEYWORDS = ['同學', '同事', '親戚', '朋友'];

export function isRelationOrSideQuery(query: string): boolean {
  const { side, relation } = parseSideRelationQuery(query);
  const relQ = relation.toLowerCase();
  if (!relQ && !side) return false;

  const nameExact = GUEST_INDEX.guests.some(
    (guest) => guest.name.toLowerCase() === relQ && !side
  );
  if (nameExact) return false;

  const hits = GUEST_INDEX.guests.filter((guest) => guestMatchesRelationQuery(guest, query));
  if (hits.length === 0) return false;

  if (side) return true;

  if (GROUP_SEARCH_KEYWORDS.some((keyword) => relQ.includes(keyword))) return true;

  return hits.length >= 2;
}

/** 關係標籤：優先命中該關係賓客本人／眷屬；同桌僅在該側過半同關係時才擴充（避免混桌噪音）。 */
function photoMatchesRelationTag(photo: WeddingPhoto, relationQuery: string): boolean {
  const guests = GUEST_INDEX.guests.filter((g) => guestMatchesRelationQuery(g, relationQuery));
  if (guests.length === 0) return false;

  for (const guest of guests) {
    if (matchesName(photo, guest.name, 'person')) return true;
  }

  const { side } = parseSideRelationQuery(relationQuery);
  const tables = new Set(
    guests.map((g) => g.table).filter((t): t is number => t != null)
  );

  for (const table of tables) {
    if (!photo.tables.includes(table)) continue;
    const seatmates = GUEST_INDEX.guests.filter(
      (g) =>
        g.table === table &&
        Boolean(g.relation.trim()) &&
        (g.side.includes('男方') || g.side.includes('女方')) &&
        (!side || g.side.includes(side))
    );
    if (seatmates.length === 0) continue;
    const matchCount = seatmates.filter((g) =>
      guestMatchesRelationQuery(g, relationQuery)
    ).length;
    if (matchCount < 2 || matchCount < Math.ceil(seatmates.length * 0.6)) continue;

    // 同桌擴充只收「尚未標人名」的桌照；已有人名卻無此關係賓客者視為混桌噪音
    if (photo.names.length === 0) return true;
  }

  return false;
}

function relationGuestsInPhoto(photo: WeddingPhoto, guests: GuestRecord[]): GuestRecord[] {
  return guests.filter((guest) => matchesName(photo, guest.name, 'person'));
}

/**
 * 關係搜尋結果預算：每人有上限，避免少數高曝光賓客佔滿；
 * 仍超標時以 round-robin 公平保留各成員代表作。
 */
function applyRelationPhotoBudget(
  photos: WeddingPhoto[],
  guests: GuestRecord[]
): WeddingPhoto[] {
  if (photos.length <= RELATION_SOFT_CAP || guests.length === 0) return photos;

  let pool = photos;
  for (let cap = RELATION_MAX_PER_GUEST; cap >= 3; cap -= 1) {
    const counts = new Map<string, number>();
    const next: WeddingPhoto[] = [];
    for (const photo of pool) {
      const hits = relationGuestsInPhoto(photo, guests);
      if (hits.length === 0) {
        // 無人名的同桌擴充照：名額緊時優先丟掉
        if (cap >= RELATION_MAX_PER_GUEST && next.length < RELATION_SOFT_CAP) {
          next.push(photo);
        }
        continue;
      }
      const underCap = hits.some((g) => (counts.get(g.name) ?? 0) < cap);
      const multiMember = hits.length >= 2;
      if (!underCap && !multiMember) continue;
      next.push(photo);
      for (const guest of hits) {
        counts.set(guest.name, (counts.get(guest.name) ?? 0) + 1);
      }
    }
    pool = next;
    if (pool.length <= RELATION_SOFT_CAP) return pool;
  }

  // Round-robin：每位關係賓客輪流取一張尚未入選的照片
  const queues = new Map<string, WeddingPhoto[]>();
  for (const guest of guests) {
    queues.set(
      guest.name,
      pool.filter((photo) => matchesName(photo, guest.name, 'person'))
    );
  }

  const picked = new Set<string>();
  const out: WeddingPhoto[] = [];
  let progress = true;
  while (out.length < RELATION_SOFT_CAP && progress) {
    progress = false;
    for (const queue of queues.values()) {
      while (queue.length > 0 && picked.has(queue[0].id)) queue.shift();
      if (queue.length === 0) continue;
      const photo = queue.shift()!;
      picked.add(photo.id);
      out.push(photo);
      progress = true;
      if (out.length >= RELATION_SOFT_CAP) break;
    }
  }

  // 維持時間序
  const order = new Map(photos.map((photo, index) => [photo.id, index]));
  return out.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

/** 將搜尋框文字轉成篩選條件（桌號 / 關係標籤 / 姓名 / 一般關鍵字） */
export function buildFilterFromSearchQuery(raw: string): PhotoFilter {
  const trimmed = raw.trim();
  if (!trimmed) return EMPTY_FILTER;

  const tableNum = parseInt(trimmed, 10);
  if (!Number.isNaN(tableNum) && String(tableNum) === trimmed) {
    return { ...EMPTY_FILTER, table: tableNum, query: trimmed };
  }

  const clean = trimmed.replace(/^#/, '');

  if (isRelationOrSideQuery(clean)) {
    return { ...EMPTY_FILTER, tag: clean, query: trimmed };
  }

  const nameHits = GUEST_INDEX.guests.filter((guest) =>
    guest.name.toLowerCase().includes(clean.toLowerCase())
  );
  if (nameHits.length > 0) {
    return { ...EMPTY_FILTER, name: trimmed, query: trimmed, nameScope: 'person' };
  }

  // 以「某某 眷」標籤搜尋時，視為搜尋主人姓名
  const companionHost = hostNameFromCompanionLabel(clean);
  if (companionHost) {
    return { ...EMPTY_FILTER, name: companionHost, query: trimmed, nameScope: 'person' };
  }

  return { ...EMPTY_FILTER, query: trimmed };
}

export function parseTableFromTag(tag: string): number | null {
  const cleaned = tag.replace(/^#/, '').trim();
  const named = cleaned.match(/^(\d{1,2})\s+/);
  if (named) return parseInt(named[1], 10);
  const legacy = cleaned.match(/第\s*(\d{1,2})\s*桌/);
  return legacy ? parseInt(legacy[1], 10) : null;
}

export function parseRelationFromTag(tag: string): string | null {
  const cleaned = tag.replace(/^#/, '').trim();
  if (parseTableFromTag(cleaned)) return null;
  return cleaned || null;
}

export function guestTableForName(name: string): number | null {
  const lower = name.toLowerCase();
  const guest = GUEST_INDEX.guests.find((g) => g.name.toLowerCase() === lower);
  return guest?.table ?? null;
}

function normalizeNameKey(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '');
}

/** 「陳岳陽 眷」「洪婉琦 眷」「李淑美 眷2」→ 主人名 */
export function hostNameFromCompanionLabel(label: string): string | null {
  const match = label.trim().match(/^(.+?)\s*眷\d*$/);
  return match?.[1]?.trim() || null;
}

function isCompanionLabelOfHost(label: string, hostLower: string): boolean {
  const normalizedLabel = normalizeNameKey(label);
  const normalizedHost = normalizeNameKey(hostLower);
  if (!normalizedHost) return false;
  const rest = normalizedLabel.slice(normalizedHost.length);
  return normalizedLabel.startsWith(normalizedHost) && /^眷\d*$/.test(rest);
}

function nameMatchesQuery(candidate: string, queryLower: string): boolean {
  const candidateLower = candidate.toLowerCase();
  return (
    candidateLower === queryLower ||
    candidateLower.includes(queryLower) ||
    queryLower.includes(candidateLower)
  );
}

/** 搜尋姓名時一併命中的眷屬標籤（含獨立姓名眷屬） */
export function companionNamesForQuery(name: string): string[] {
  const queryLower = name.trim().toLowerCase();
  if (!queryLower) return [];

  const out = new Set<string>();
  for (const [host, companions] of Object.entries(COMPANIONS_BY_HOST)) {
    if (!nameMatchesQuery(host, queryLower)) continue;
    for (const companion of companions) out.add(companion);
  }
  return [...out];
}

function matchingHostNames(queryLower: string): string[] {
  const hosts = new Set<string>();
  hosts.add(queryLower);
  for (const guest of GUEST_INDEX.guests) {
    if (nameMatchesQuery(guest.name, queryLower)) hosts.add(guest.name.toLowerCase());
  }
  for (const host of Object.keys(COMPANIONS_BY_HOST)) {
    if (nameMatchesQuery(host, queryLower)) hosts.add(host.toLowerCase());
  }
  return [...hosts];
}

function nameInPhoto(photo: WeddingPhoto, nameLower: string): boolean {
  return photo.names.some((n) => n.toLowerCase().includes(nameLower));
}

function photoHasCompanionOfQuery(photo: WeddingPhoto, queryLower: string): boolean {
  const companions = companionNamesForQuery(queryLower);
  if (
    companions.some((companion) => {
      const companionKey = normalizeNameKey(companion);
      return photo.names.some((n) => normalizeNameKey(n) === companionKey);
    })
  ) {
    return true;
  }

  const hosts = matchingHostNames(queryLower);
  return photo.names.some((label) => hosts.some((host) => isCompanionLabelOfHost(label, host)));
}

function tablesForNameQuery(nameLower: string): number[] {
  const tables = new Set<number>();
  for (const g of GUEST_INDEX.guests) {
    if (g.name.toLowerCase().includes(nameLower) && g.table != null) {
      tables.add(g.table);
    }
  }
  return [...tables];
}

function matchesName(photo: WeddingPhoto, name: string, scope: PhotoFilter['nameScope']): boolean {
  const nameLower = name.trim().toLowerCase();
  if (!nameLower) return true;
  // 本人，或標籤本身含姓名（含「某某 眷」）
  if (nameInPhoto(photo, nameLower)) return true;
  // 獨立姓名眷屬，或尚未入索引的「主人 眷N」標籤
  if (photoHasCompanionOfQuery(photo, nameLower)) return true;
  if (scope === 'person') return false;
  return tablesForNameQuery(nameLower).some((t) => photo.tables.includes(t));
}

export function filterPhotos(stages: WeddingStage[], filter: PhotoFilter): WeddingPhoto[] {
  const all = stages.flatMap((s) => s.photos);
  if (isFilterEmpty(filter)) return all;

  let result = all.filter((photo) => matchesFilter(photo, filter));

  // 關係／親友別群組：限制結果量，避免少數高曝光人把整個群組撐爆
  if (filter.tag) {
    const rel = parseRelationFromTag(filter.tag);
    if (rel && isRelationOrSideQuery(rel)) {
      const guests = GUEST_INDEX.guests.filter((g) => guestMatchesRelationQuery(g, rel));
      result = applyRelationPhotoBudget(result, guests);
    }
  }

  return result;
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

  if (filter.name && !matchesName(photo, filter.name, filter.nameScope)) return false;

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
        (rel != null && photoMatchesRelationTag(photo, rel));
      if (!tagHit) return false;
    }
  }

  if (filter.query.trim() && !filter.name) {
    const q = filter.query.trim().toLowerCase();
    const tableNum = parseInt(q, 10);
    const tableMatch = !Number.isNaN(tableNum) && photo.tables.includes(tableNum);
    const textBlob = [
      photo.caption,
      photo.time,
      ...photo.tags,
      ...photo.names,
      ...photo.tables.map((t) => formatTableTag(t).replace(/^#/, '')),
    ]
      .join(' ')
      .toLowerCase();

    const guestMatch = GUEST_INDEX.guests.some(
      (g) =>
        (g.name.toLowerCase().includes(q) || guestMatchesRelationQuery(g, q)) &&
        (g.table == null || photo.tables.includes(g.table))
    );

    if (!tableMatch && !textBlob.includes(q) && !guestMatch) return false;
  }

  return true;
}

export function filterLabel(filter: PhotoFilter): string | null {
  if (filter.name) {
    const scope = filter.nameScope === 'table' ? '（含同桌）' : '（含眷屬）';
    return `「${filter.name}」的照片${scope}`;
  }
  if (filter.table != null) return formatTableFilterTitle(filter.table);
  if (filter.tag) return filter.tag.startsWith('#') ? filter.tag : `#${filter.tag}`;
  if (filter.category && filter.category !== 'all') {
    return PHOTO_CATEGORIES.find((c) => c.id === filter.category)?.label ?? null;
  }
  if (filter.query.trim()) return `搜尋「${filter.query.trim()}」`;
  return null;
}
