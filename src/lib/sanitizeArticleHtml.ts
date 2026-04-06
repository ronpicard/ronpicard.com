import DOMPurify from 'isomorphic-dompurify'
import type { UponSanitizeAttributeHook } from 'dompurify'
import { resolveResourcePathsInHtml } from './assetUrl'

const ALLOWED_TAGS = [
  'p',
  'br',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'a',
  'strong',
  'b',
  'em',
  'i',
  'blockquote',
  'pre',
  'code',
  'img',
  'hr',
  'div',
  'span',
  'figure',
  'figcaption',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
] as const

const ALLOWED_ATTR = ['href', 'src', 'alt', 'title', 'class', 'colspan', 'rowspan'] as const

/** Allowed <img src> after base URL rewrite: only mirrored assets under /resources/. */
function resourceImgSrcPattern(): RegExp {
  const baseRaw =
    (import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ||
    ((globalThis as unknown as { __VITE_BASE_URL__?: string }).__VITE_BASE_URL__ ?? '/') ||
    '/'
  const base = baseRaw.replace(/\/$/, '') || ''
  const seg = base.replace(/^\//, '')
  if (seg) {
    return new RegExp(
      `^\\/${seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\/resources\\/[^\\s"']+$`,
      'i',
    )
  }
  return /^\/resources\/[^\s"']+$/i
}

/**
 * Mirrors `scripts/fetch-site-articles.mjs` so stored HTML stays safe at render time
 * even if `siteArticles.json` is edited without running the fetch pipeline.
 */
export function prepareArticleBodyHtml(html: string | null | undefined): string | null {
  const resolved = resolveResourcePathsInHtml(html)
  if (!resolved?.trim()) return null

  const okImgSrc = resourceImgSrcPattern()

  const hook: UponSanitizeAttributeHook = (node, data) => {
    const name = data.attrName?.toLowerCase()
    if (name !== 'src' && name !== 'href') return
    const v = data.attrValue?.trim() ?? ''
    if (!v) {
      data.keepAttr = false
      return
    }
    const tag = node.tagName
    if (tag === 'IMG' && name === 'src') {
      if (!okImgSrc.test(v)) data.keepAttr = false
      return
    }
    if (tag === 'A' && name === 'href') {
      if (/^https?:\/\//i.test(v)) {
        try {
          const u = new URL(v)
          if (u.protocol !== 'https:' && u.protocol !== 'http:') data.keepAttr = false
          if (u.username || u.password) data.keepAttr = false
        } catch {
          data.keepAttr = false
        }
        return
      }
      if (!okImgSrc.test(v)) data.keepAttr = false
    }
  }

  DOMPurify.addHook('uponSanitizeAttribute', hook)
  let safe: string
  try {
    safe = DOMPurify.sanitize(resolved, {
      ALLOWED_TAGS: [...ALLOWED_TAGS],
      ALLOWED_ATTR: [...ALLOWED_ATTR],
      ALLOW_DATA_ATTR: false,
      FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'svg'],
      FORBID_ATTR: [
        'onerror',
        'onload',
        'onclick',
        'onmouseover',
        'onmouseenter',
        'onmouseleave',
        'onfocus',
        'onblur',
        'onkeydown',
        'onkeyup',
        'onkeypress',
        'oninput',
        'onchange',
        'onsubmit',
        'onabort',
        'onauxclick',
        'onpointerdown',
        'onpointerup',
      ],
    })
  } finally {
    DOMPurify.removeHook('uponSanitizeAttribute', hook)
  }

  safe = safe.replace(/<a(\s+[^>]*?)>/gi, (full, inner: string) => {
    if (/target\s*=/i.test(inner)) return full
    if (!/href\s*=\s*["']https?:/i.test(inner)) return full
    return `<a${inner} target="_blank" rel="noopener noreferrer">`
  })

  const trimmed = safe.trim()
  return trimmed || null
}
