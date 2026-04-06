/**
 * Mirrored assets live under public/resources/ and are referenced as
 * `resources/...` in JSON. Prefix Vite base for GitHub Pages.
 */
export function resolveAssetUrl(url: string | null | undefined): string | null {
  if (url == null || url === '') return null
  if (/^https?:\/\//i.test(url)) return url
  const base = import.meta.env.BASE_URL
  const b = base.endsWith('/') ? base.slice(0, -1) : base
  const path = url.replace(/^\//, '')
  return `${b}/${path}`
}

/** Inline HTML uses relative resource paths; inject base for img/src and a/href. */
export function resolveResourcePathsInHtml(html: string | null | undefined): string | null {
  if (html == null || html === '') return null
  const base = import.meta.env.BASE_URL
  const b = base.endsWith('/') ? base.slice(0, -1) : base
  return html.replace(/\b(src|href)="(resources\/[^"]+)"/gi, (_, attr, p) => `${attr}="${b}/${p}"`)
}
