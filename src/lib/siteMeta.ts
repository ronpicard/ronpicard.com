/** Public site root (GitHub Pages). Override if you use a custom domain. */
export const SITE_CANONICAL_ROOT = 'https://ronpicard.github.io/ronpicard.com'

const SITE_NAME = 'Ron Picard'

export const DEFAULT_TITLE = `${SITE_NAME} — Software, projects & notes`
export const DEFAULT_DESCRIPTION =
  'Portfolio of Ron Picard: web apps, formal methods, software lessons, research papers, and engineering projects.'

export function canonicalHashUrl(route: string): string {
  const p = route.startsWith('/') ? route : `/${route}`
  return `${SITE_CANONICAL_ROOT}/#${p}`
}

/** Absolute URL for mirrored assets (e.g. resources/*.png) — for Open Graph. */
export function absoluteAssetUrl(rel: string | null | undefined): string | undefined {
  if (!rel?.trim()) return undefined
  const p = rel.replace(/^\/+/, '')
  if (/^https?:\/\//i.test(p)) return p
  return `${SITE_CANONICAL_ROOT}/${p}`
}

export function truncateMetaDescription(text: string, max = 158): string {
  const t = text.replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1).trim()}…`
}
