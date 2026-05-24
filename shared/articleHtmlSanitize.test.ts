import { describe, expect, it } from 'vitest'
import { ARTICLE_HTML_MAX_CHARS, hardenExternalAnchors, sanitizeArticleHtmlRaw } from './articleHtmlSanitize'

describe('sanitizeArticleHtmlRaw', () => {
  it('removes script tags and dangerous attributes', () => {
    const out = sanitizeArticleHtmlRaw('<p>ok</p><script>alert(1)</script>')
    expect(out).toBe('<p>ok</p>')
    expect(out).not.toContain('script')
  })

  it('strips javascript: links', () => {
    const out = sanitizeArticleHtmlRaw('<a href="javascript:alert(1)">x</a>')
    expect(out).not.toContain('javascript:')
  })

  it('allows https links and hardens them', () => {
    const out = sanitizeArticleHtmlRaw('<a href="https://example.com">link</a>')
    expect(out).toContain('href="https://example.com"')
    expect(out).toContain('rel="noopener noreferrer"')
    expect(out).toContain('target="_blank"')
  })

  it('restricts img src to resource pattern when provided', () => {
    const pattern = /^\/resources\/[^"']+$/i
    const allowed = sanitizeArticleHtmlRaw('<img src="/resources/abc.png" alt="">', {
      resourceImgPattern: pattern,
    })
    const blocked = sanitizeArticleHtmlRaw('<img src="https://evil.test/x.png" alt="">', {
      resourceImgPattern: pattern,
    })
    expect(allowed).toContain('src="/resources/abc.png"')
    expect(blocked).not.toContain('src=')
  })

  it('returns null when html exceeds max length', () => {
    expect(sanitizeArticleHtmlRaw('x'.repeat(ARTICLE_HTML_MAX_CHARS + 1))).toBeNull()
  })
})

describe('hardenExternalAnchors', () => {
  it('does not duplicate rel when already present', () => {
    const html =
      '<a href="https://a.test" target="_blank" rel="noopener noreferrer">x</a>'
    expect(hardenExternalAnchors(html)).toBe(html)
  })
})
