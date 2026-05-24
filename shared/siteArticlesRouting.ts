/**
 * Shared article ordering and public route slug logic (app + prerender scripts).
 */

export function decodeHtml(raw: string): string {
  return String(raw || '')
    .replace(/&mdash;/gi, '—')
    .replace(/&ndash;/gi, '–')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s*[—–]\s*Home\s*$/i, '')
    .trim()
}

/** URL segment derived from the post title (not Squarespace storage slugs). */
export function slugifyTitleForRoute(title: string): string {
  let s = decodeHtml(title)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
  s = s.replace(/[—–]/g, '-')
  s = s.replace(/[^a-z0-9]+/g, '-')
  s = s.replace(/^-+|-+$/g, '').replace(/-+/g, '-')
  if (s.length > 96) {
    s = s.slice(0, 96).replace(/-[^-]+$/, '')
  }
  return s || 'post'
}

export function uniqueSlugsFromTitles(titles: string[]): string[] {
  const counts = new Map<string, number>()
  return titles.map((title) => {
    const base = slugifyTitleForRoute(title)
    const n = (counts.get(base) ?? 0) + 1
    counts.set(base, n)
    return n === 1 ? base : `${base}-${n}`
  })
}

function isDataStructuresVisualizerRow(row: {
  githubEmbed?: string | null
  demoUrl?: string | null
}): boolean {
  const s = `${row.githubEmbed || ''}${row.demoUrl || ''}`
  return s.includes('data-structures-visualizer-web-app')
}

function articleDate(entry: { date?: string; row?: { date?: string } }): string {
  return String(entry.date ?? entry.row?.date ?? '')
}

function articleRow(entry: {
  row?: { githubEmbed?: string | null; demoUrl?: string | null }
  githubEmbed?: string | null
  demoUrl?: string | null
}) {
  const r = entry.row ?? entry
  return {
    githubEmbed: r.githubEmbed,
    demoUrl: r.demoUrl,
  }
}

type SortableEntry = {
  date?: string
  sourceIndex?: number
  row?: { date?: string; githubEmbed?: string | null; demoUrl?: string | null }
  githubEmbed?: string | null
  demoUrl?: string | null
}

/** Sort key used by `articles.ts` and `prerender.mjs`. */
export function compareIndexedArticles(a: SortableEntry, b: SortableEntry): number {
  const dateA = articleDate(a)
  const dateB = articleDate(b)
  const byDate = dateB.localeCompare(dateA)
  if (byDate !== 0) return byDate
  if (dateA === '2026-03-22' && dateB === '2026-03-22') {
    const aData = isDataStructuresVisualizerRow(articleRow(a))
    const bData = isDataStructuresVisualizerRow(articleRow(b))
    if (aData !== bData) return aData ? 1 : -1
  }
  return (b.sourceIndex ?? 0) - (a.sourceIndex ?? 0)
}

export function sortIndexedArticles<T extends { sourceIndex?: number }>(indexed: T[]): T[] {
  return [...indexed].sort(compareIndexedArticles)
}

/** Pre–Mar-2026 refresh URLs used “… Web App” in the title; keep old /blog/* paths working. */
export function legacySlugTitle(
  title: string,
  row: { date?: string; githubEmbed?: string | null },
): string {
  const date = String(row.date ?? '')
  return date >= '2026-03-22' && row.githubEmbed ? `${title.trim()} Web App` : title
}

type SlugRow = {
  title: string
  date?: string
  githubEmbed?: string | null
}

/**
 * Builds current and legacy public route slugs for sorted article rows.
 * @param titlesDecoded — true when titles were already passed through `decodeHtml` (app data).
 */
export function buildArticleRouteSlugs(
  rows: SlugRow[],
  options: { titlesDecoded?: boolean } = {},
): { routeSlugs: string[]; legacyRouteSlugs: string[] } {
  const titles = options.titlesDecoded
    ? rows.map((r) => r.title)
    : rows.map((r) => decodeHtml(r.title))
  const routeSlugs = uniqueSlugsFromTitles(titles)
  const titlesForLegacy = titles.map((t, i) => legacySlugTitle(t, rows[i]!))
  const legacyRouteSlugs = uniqueSlugsFromTitles(titlesForLegacy)
  return { routeSlugs, legacyRouteSlugs }
}
