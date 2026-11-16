/**
 * Full-text search index of article bodies. The Vite build writes it to
 * `search-index.json` (and the dev server serves it) from
 * `public/article-bodies/`; the header search loads it on first use so title
 * and summary matches stay instant and the bodies cost nothing until needed.
 */
import { decodeHtmlEntities } from './htmlEscape.ts'

export const SEARCH_INDEX_FILE = 'search-index.json'
export const SEARCH_INDEX_VERSION = 1
/** Well above today's index (about 0.5 MB) while bounding what the client will read. */
export const SEARCH_INDEX_MAX_BYTES = 4_000_000

const BODY_PATH_RE = /^article-bodies\/[a-z0-9][a-z0-9._-]*\.html$/i

export type SearchIndex = ReadonlyMap<string, string>

/**
 * Lower-cased plain text, the form search queries are compared in. Code,
 * captions, and alt text count; markup and control characters do not.
 */
export function searchableText(html: string): string {
  const withAlt = html.replace(/<img\b[^>]*\balt="([^"]*)"[^>]*>/gi, ' $1 ')
  return decodeHtmlEntities(withAlt.replace(/<[^>]*>/g, ' '))
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** Serialized index for `{ "article-bodies/x.html": "<html>" }`, keys sorted for stable output. */
export function buildSearchIndex(bodies: Record<string, string>): string {
  const entries = Object.keys(bodies)
    .filter((path) => BODY_PATH_RE.test(path))
    .sort()
    .map((path) => [path, searchableText(bodies[path] ?? '')] as const)
  return JSON.stringify({ version: SEARCH_INDEX_VERSION, bodies: Object.fromEntries(entries) })
}

/** Validates a fetched index; throws with the reason when it is not one. */
export function parseSearchIndex(raw: unknown): SearchIndex {
  if (!raw || typeof raw !== 'object') throw new Error('search index is not an object')
  const { version, bodies } = raw as { version?: unknown; bodies?: unknown }
  if (version !== SEARCH_INDEX_VERSION) throw new Error(`search index version ${String(version)} is not supported`)
  if (!bodies || typeof bodies !== 'object' || Array.isArray(bodies)) {
    throw new Error('search index has no bodies')
  }
  const index = new Map<string, string>()
  for (const [path, text] of Object.entries(bodies)) {
    if (BODY_PATH_RE.test(path) && typeof text === 'string') index.set(path, text)
  }
  return index
}
