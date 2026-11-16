import { escapeHtmlAttr } from '../../shared/htmlEscape'
import { getViteBasePath, resolveSizedSrcSet } from './assetUrl'

/** The article column is at most 720px wide (.page in index.css). */
export const BODY_IMAGE_SIZES = '(min-width: 48rem) 42rem, 100vw'

/** `/base/resources/x.png` (or `resources/x.png`) → `resources/x.png`, else null. */
function resourcePathFromSrc(src: string | null): string | null {
  if (!src) return null
  const prefix = `${getViteBasePath()}/`
  const rel = src.startsWith(prefix) ? src.slice(prefix.length) : src
  return rel.startsWith('resources/') ? rel : null
}

/**
 * Gives local raster images in sanitized article HTML a responsive `srcset`
 * of the generated WebP copies, plus lazy loading and async decoding. A pure
 * string pass, so the prerendered page carries the attributes and the browser
 * never fetches the full-size original first. The attribute values come only
 * from the validated `src`, never from the input's other attributes.
 */
export function addResponsiveImageAttrs(html: string): string {
  return html.replace(/<img\b([^>]*)>/gi, (tag, attrs: string) => {
    if (/\s(?:srcset|loading)\s*=/i.test(attrs)) return tag
    const src = /\ssrc="([^"]*)"/i.exec(attrs)?.[1] ?? null
    const srcset = resolveSizedSrcSet(resourcePathFromSrc(src))
    if (!srcset) return tag
    return `<img${attrs} srcset="${escapeHtmlAttr(srcset)}" sizes="${BODY_IMAGE_SIZES}" loading="lazy" decoding="async">`
  })
}

/**
 * Falls back to the original `src` for any image whose generated copy is
 * missing (a dev server without `npm run generate:sized`), whether it failed
 * before this runs or after. Returns a cleanup that removes the listeners.
 */
export function enhanceBodyImages(root: ParentNode): () => void {
  const cleanups: Array<() => void> = []
  for (const img of root.querySelectorAll<HTMLImageElement>('img[srcset]')) {
    const fallBack = () => {
      img.removeAttribute('srcset')
      img.removeAttribute('sizes')
    }
    if (img.complete && img.naturalWidth === 0 && img.currentSrc) {
      fallBack()
      continue
    }
    img.addEventListener('error', fallBack, { once: true })
    cleanups.push(() => img.removeEventListener('error', fallBack))
  }
  return () => cleanups.forEach((fn) => fn())
}
