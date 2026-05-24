/**
 * Mirrored assets live under public/resources/ and are referenced as
 * `resources/...` in JSON. Prefix Vite base for GitHub Pages.
 */
export function getViteBasePath(): string {
  const baseRaw =
    (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ||
    ((globalThis as unknown as { __VITE_BASE_URL__?: string }).__VITE_BASE_URL__ ?? '/') ||
    '/'
  return baseRaw.endsWith('/') ? baseRaw.slice(0, -1) : baseRaw || ''
}

export function resolveAssetUrl(url: string | null | undefined): string | null {
  if (url == null || url === '') return null
  if (/^https?:\/\//i.test(url)) return url
  const b = getViteBasePath()
  const path = url.replace(/^\//, '')
  return `${b}/${path}`
}

/** Inline HTML uses relative resource paths; inject base for img/src and a/href. */
export function resolveResourcePathsInHtml(html: string | null | undefined): string | null {
  if (html == null || html === '') return null
  const b = getViteBasePath()
  return html.replace(/\b(src|href)="(resources\/[^"]+)"/gi, (_, attr, p) => `${attr}="${b}/${p}"`)
}
