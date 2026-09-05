const STORAGE_KEY = 'photo_recent_searches';
const MAX = 5;

export function getRecentSearches(): string[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

export function addRecentSearch(query: string) {
  const q = query.trim();
  if (!q) return;
  const prev = getRecentSearches().filter((s) => s !== q);
  const next = [q, ...prev].slice(0, MAX);
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
