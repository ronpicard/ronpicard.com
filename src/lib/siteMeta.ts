/** Public site root (custom domain). */
export const SITE_CANONICAL_ROOT = 'https://ronpicard.com'

const SITE_NAME = 'Ron Picard'

export const DEFAULT_TITLE = `${SITE_NAME} — My project involving AI, Software, Aviation, and more`
export const DEFAULT_DESCRIPTION =
  'Ron Picard — My project involving AI, Software, Aviation, and more: portfolio, web apps, software lessons, research, and engineering work.'

export function canonicalUrl(route: string): string {
  const p = route.startsWith('/') ? route : `/${route}`
  return `${SITE_CANONICAL_ROOT}${p}`
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
