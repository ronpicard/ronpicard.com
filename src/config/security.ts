/** Shared limits and CSP used by Vite (production HTML) and runtime guards. */

const PRODUCTION_CSP_DIRECTIVES = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "worker-src 'none'",
  "manifest-src 'self'",
  "frame-src https://www.youtube-nocookie.com https://ronpicard.github.io",
  "img-src 'self' data: https:",
  "font-src 'self' https://fonts.gstatic.com data:",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "script-src 'self'",
  "connect-src 'self' https://raw.githubusercontent.com https://api.github.com",
  "media-src 'self' https:",
  "upgrade-insecure-requests",
] as const

export function buildProductionCsp(): string {
  return PRODUCTION_CSP_DIRECTIVES.join('; ')
}

/** Extra defense-in-depth tags injected in production `index.html` (Vite build). */
export const PRODUCTION_SECURITY_METAS: ReadonlyArray<{
  httpEquiv?: string
  name?: string
  content: string
}> = [
  { httpEquiv: 'Cross-Origin-Opener-Policy', content: 'same-origin-allow-popups' },
  { name: 'referrer', content: 'strict-origin-when-cross-origin' },
]

export const README_FETCH_TIMEOUT_MS = 12_000
export const README_MAX_BYTES = 512 * 1024
export const SEARCH_QUERY_MAX_LEN = 120
export const PUBLIC_SLUG_MAX_LEN = 96
export const PUBLIC_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i

export function isSafePublicSlug(slug: string | undefined | null): slug is string {
  if (!slug) return false
  const s = slug.trim()
  if (!s || s.length > PUBLIC_SLUG_MAX_LEN) return false
  return PUBLIC_SLUG_RE.test(s)
}
