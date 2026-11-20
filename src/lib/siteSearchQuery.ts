import { SEARCH_QUERY_MAX_LEN } from '../config/security'

function normalizeSearchText(s: string): string {
  return s
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** Normalize and bound search input (control chars stripped, length capped). */
export function normalizeSearchQuery(s: string): string {
  return normalizeSearchText(s).slice(0, SEARCH_QUERY_MAX_LEN)
}

/** Case-insensitive substring match against title + summary. Empty query matches all. */
export function articleMatchesSearch(
  query: string,
  title: string,
  summary: string | null,
): boolean {
  const q = normalizeSearchQuery(query)
  if (!q) return true
  return normalizeSearchText(`${title} ${summary ?? ''}`).includes(q)
}

type Searchable = { title: string; summary: string | null; bodyPath?: string | null; sourceSlug?: string }

/**
 * Posts matching `query`: title, summary, and post id (`sourceSlug`) matches
 * first, so "botlegger" still finds "Bot Legger", then posts that mention it only in their body (when the full-text `bodies` index, keyed by
 * body path, has loaded). Each group keeps the input order.
 */
export function searchArticles<T extends Searchable>(
  query: string,
  items: readonly T[],
  bodies: ReadonlyMap<string, string> | null,
): T[] {
  const q = normalizeSearchQuery(query)
  if (!q) return [...items]
  const head: T[] = []
  const inBody: T[] = []
  for (const item of items) {
    if (articleMatchesSearch(q, item.title, item.summary) || item.sourceSlug?.includes(q)) head.push(item)
    else if (item.bodyPath && bodies?.get(item.bodyPath)?.includes(q)) inBody.push(item)
  }
  return [...head, ...inBody]
}
