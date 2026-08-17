import { SEARCH_QUERY_MAX_LEN } from '../config/security'

/** Normalize and bound search input (control chars stripped, length capped). */
export function normalizeSearchQuery(s: string): string {
  return s
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, SEARCH_QUERY_MAX_LEN)
}

/** Case-insensitive substring match against title + summary. Empty query matches all. */
export function articleMatchesSearch(
  query: string,
  title: string,
  summary: string | null,
): boolean {
  const q = normalizeSearchQuery(query)
  if (!q) return true
  const hay = `${title} ${summary ?? ''}`.toLowerCase()
  return hay.includes(q)
}
