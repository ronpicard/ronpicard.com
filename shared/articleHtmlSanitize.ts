/**
 * DOMPurify rules shared by `src/lib/sanitizeArticleHtml.ts` and `scripts/fetch-site-articles.mjs`.
 */
import DOMPurify from 'isomorphic-dompurify'
import type { UponSanitizeAttributeHook } from 'dompurify'
import { UNSAFE_HREF_SCHEME_RE } from './urlSchemes'

export const ARTICLE_HTML_MAX_CHARS = 2_000_000

const ALLOWED_URI_REGEXP = /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i

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

const FORBID_TAGS = [
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'form',
  'input',
  'button',
  'svg',
] as const

const FORBID_ATTR = [
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
] as const

function stripResidualUnsafeLinks(html: string): string {
  return html.replace(/<a\s+([^>]*?)href\s*=\s*["']([^"']*)["']/gi, (full, before, href) => {
    const h = href.trim()
    if (!UNSAFE_HREF_SCHEME_RE.test(h)) return full
    return `<a ${before.replace(/\s*href\s*=\s*["'][^"']*["']/i, '')}>`
  })
}

export function hardenExternalAnchors(html: string): string {
  return html.replace(/<a(\s+[^>]*?)>/gi, (full, inner: string) => {
    if (/target\s*=/i.test(inner) && /rel\s*=/i.test(inner)) return full
    if (!/href\s*=\s*["']https?:/i.test(inner)) return full
    const rel = /rel\s*=/i.test(inner) ? inner : `${inner} rel="noopener noreferrer"`
    const target = /target\s*=/i.test(rel) ? rel : `${rel} target="_blank"`
    return `<a${target}`
  })
}

export function sanitizeArticleHtmlRaw(
  html: string,
  options: { resourceImgPattern?: RegExp | null; maxChars?: number } = {},
): string | null {
  const { resourceImgPattern = null, maxChars = ARTICLE_HTML_MAX_CHARS } = options
  if (html.length > maxChars) return null
  const resolved = html.trim()
  if (!resolved) return null

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
      if (resourceImgPattern && !resourceImgPattern.test(v)) data.keepAttr = false
      return
    }
    if (tag === 'A' && name === 'href') {
      if (UNSAFE_HREF_SCHEME_RE.test(v)) {
        data.keepAttr = false
        return
      }
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
      if (resourceImgPattern && !resourceImgPattern.test(v)) data.keepAttr = false
    }
  }

  DOMPurify.addHook('uponSanitizeAttribute', hook)
  let safe: string
  try {
    safe = DOMPurify.sanitize(resolved, {
      ALLOWED_TAGS: [...ALLOWED_TAGS],
      ALLOWED_ATTR: [...ALLOWED_ATTR],
      ALLOW_DATA_ATTR: false,
      ALLOWED_URI_REGEXP,
      FORBID_TAGS: [...FORBID_TAGS],
      FORBID_ATTR: [...FORBID_ATTR],
    })
  } finally {
    DOMPurify.removeHook('uponSanitizeAttribute', hook)
  }

  safe = stripResidualUnsafeLinks(safe)
  safe = hardenExternalAnchors(safe)
  const trimmed = safe.trim()
  return trimmed || null
}
