/**
 * Mirrored assets live under public/resources/ and are referenced as
 * `resources/...` in JSON. Prefix Vite base for GitHub Pages.
 */
const LOCAL_ASSET_PATH_RE =
  /^(?:resources\/[a-z0-9][a-z0-9._-]*|article-bodies\/[a-z0-9][a-z0-9._-]*\.html)$/i
const YOUTUBE_THUMBNAIL_PATH_RE =
  /^\/vi\/[a-zA-Z0-9_-]{6,32}\/(?:default|mqdefault|hqdefault|sddefault|maxresdefault)\.jpg$/

export function getViteBasePath(): string {
  const baseRaw =
    (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ||
    ((globalThis as unknown as { __VITE_BASE_URL__?: string }).__VITE_BASE_URL__ ?? '/') ||
    '/'
  return baseRaw.endsWith('/') ? baseRaw.slice(0, -1) : baseRaw || ''
}

export function isSafeLocalAssetPath(url: string): boolean {
  return LOCAL_ASSET_PATH_RE.test(url)
}

function safeExternalImageUrl(raw: string): string | null {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return null
  }
  if (url.protocol !== 'https:' || url.hostname.toLowerCase() !== 'img.youtube.com') return null
  if (url.username || url.password || url.search || url.hash) return null
  if (!YOUTUBE_THUMBNAIL_PATH_RE.test(url.pathname)) return null
  return url.toString()
}

export function resolveAssetUrl(url: string | null | undefined): string | null {
  if (url == null || url === '') return null
  const trimmed = url.trim()
  if (/^https?:\/\//i.test(trimmed)) return safeExternalImageUrl(trimmed)
  if (!isSafeLocalAssetPath(trimmed)) return null
  const b = getViteBasePath()
  return `${b}/${trimmed}`
}

/** Inline HTML uses relative resource paths; inject base for img/src and a/href. */
export function resolveResourcePathsInHtml(html: string | null | undefined): string | null {
  if (html == null || html === '') return null
  const b = getViteBasePath()
  return html.replace(/\b(src|href)="(resources\/[^"]+)"/gi, (_, attr, p) => `${attr}="${b}/${p}"`)
}
