import guestCsvRaw from '../data/guest.csv?raw';
import type { GuestRecord } from '../types';

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

export function parseGuestCsv(raw: string): GuestRecord[] {
  const text = raw.replace(/^\uFEFF/, '').trim();
  const lines = text.split(/\r?\n/);
  const records: GuestRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = parseCsvLine(line);
    if (parts.length < 6) continue;

    const [idRaw, name, headcountRaw, side, relation, tableRaw] = parts;
    if (!name?.trim() || !idRaw?.trim() || Number.isNaN(Number(idRaw))) continue;

    const tableMatch = tableRaw?.match(/^(\d{1,2})/);
    const table = tableMatch ? parseInt(tableMatch[1], 10) : null;

    records.push({
      id: parseInt(idRaw, 10),
      name: name.trim(),
      headcount: headcountRaw?.trim() ? parseInt(headcountRaw, 10) : null,
      side: side?.trim() ?? '',
      relation: relation?.trim() ?? '',
      table,
      tableLabel: tableRaw?.trim() ?? '',
    });
  }

  return records;
}

export interface GuestIndex {
  guests: GuestRecord[];
  byName: Map<string, GuestRecord[]>;
  byTable: Map<number, GuestRecord[]>;
  byRelation: Map<string, GuestRecord[]>;
  bySide: Map<string, GuestRecord[]>;
}

export function buildGuestIndex(guests: GuestRecord[]): GuestIndex {
  const byName = new Map<string, GuestRecord[]>();
  const byTable = new Map<number, GuestRecord[]>();
  const byRelation = new Map<string, GuestRecord[]>();
  const bySide = new Map<string, GuestRecord[]>();

  for (const guest of guests) {
    const nameKey = guest.name.toLowerCase();
    if (!byName.has(nameKey)) byName.set(nameKey, []);
    byName.get(nameKey)!.push(guest);

    if (guest.table != null) {
      if (!byTable.has(guest.table)) byTable.set(guest.table, []);
      byTable.get(guest.table)!.push(guest);
    }

    const relKey = guest.relation;
    if (!byRelation.has(relKey)) byRelation.set(relKey, []);
    byRelation.get(relKey)!.push(guest);

    const sideKey = guest.side;
    if (!bySide.has(sideKey)) bySide.set(sideKey, []);
    bySide.get(sideKey)!.push(guest);
  }

  return { guests, byName, byTable, byRelation, bySide };
}

export const GUEST_RECORDS = parseGuestCsv(guestCsvRaw);
export const GUEST_INDEX = buildGuestIndex(GUEST_RECORDS);

export function searchGuests(query: string, limit = 8): GuestRecord[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const seen = new Set<number>();
  const results: GuestRecord[] = [];

  for (const guest of GUEST_RECORDS) {
    if (seen.has(guest.id)) continue;
    const nameMatch = guest.name.toLowerCase().includes(q);
    const tableMatch = guest.table != null && String(guest.table).includes(q);
    const relationMatch = guest.relation.toLowerCase().includes(q);
    const sideMatch = guest.side.toLowerCase().includes(q);

    if (nameMatch || tableMatch || relationMatch || sideMatch) {
      seen.add(guest.id);
      results.push(guest);
      if (results.length >= limit) break;
    }
  }

  return results;
}

export function formatGuestSubtitle(guest: GuestRecord): string {
  const parts: string[] = [];
  if (guest.table != null) parts.push(`第 ${guest.table} 桌`);
  if (guest.side) parts.push(guest.side);
  if (guest.relation) parts.push(guest.relation);
  return parts.join(' · ');
}
