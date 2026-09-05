import type { GuestRecord } from '../types';

let tableNameMap: Map<number, string> | null = null;

export function parseTableLabelRaw(raw: string): { number: number | null; name: string } {
  const trimmed = raw.trim();
  const match = trimmed.match(/^(\d{1,2})\.?\s*(.*)$/);
  if (!match) return { number: null, name: trimmed };
  const number = parseInt(match[1], 10);
  return { number: Number.isNaN(number) ? null : number, name: match[2]?.trim() || '' };
}

export function initTableLabels(guests: GuestRecord[]): void {
  if (tableNameMap) return;
  tableNameMap = new Map();
  for (const guest of guests) {
    if (guest.table == null || tableNameMap.has(guest.table)) continue;
    const parsed = parseTableLabelRaw(guest.tableLabel);
    if (parsed.name) tableNameMap.set(guest.table, parsed.name);
  }
}

export function getTableName(table: number): string | null {
  return tableNameMap?.get(table) ?? null;
}

/** 顯示用：6 · 楓生水起 */
export function formatTableLabel(table: number): string {
  const name = getTableName(table);
  return name ? `${table} · ${name}` : `${table} 桌`;
}

/** 篩選標題：6 · 楓生水起 的照片 */
export function formatTableFilterTitle(table: number): string {
  return `${formatTableLabel(table)} 的照片`;
}

/** 卡片標籤：#6 楓生水起 */
export function formatTableTag(table: number): string {
  const name = getTableName(table);
  return name ? `#${table} ${name}` : `#${table} 桌`;
}

/** 卡片精簡標籤：#6楓生（桌號 + 桌名最多兩字） */
export function formatTableTagShort(table: number): string {
  const name = getTableName(table);
  if (!name) return `#${table}`;
  return `#${table}${[...name].slice(0, 2).join('')}`;
}

export function listTableOptions(): Array<{ table: number; label: string; name: string | null }> {
  return Array.from({ length: 27 }, (_, i) => i + 1).map((table) => ({
    table,
    label: formatTableLabel(table),
    name: getTableName(table),
  }));
}
