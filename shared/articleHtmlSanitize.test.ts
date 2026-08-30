import { describe, expect, it } from 'vitest'
import {
  ARTICLE_HTML_MAX_CHARS,
  hardenExternalAnchors,
  sanitizeArticleHtmlRaw,
  stripResidualUnsafeLinks,
} from './articleHtmlSanitize'

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

  it('closes hardened anchors so following siblings stay outside the link', () => {
    const out = sanitizeArticleHtmlRaw(
      '<ul><li><a href="https://example.com">link</a>: detail</li><li>plain item</li></ul>',
    )
    expect(out).toContain('>link</a>: detail')
    expect(out).toContain('<li>plain item</li>')
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

  it('returns null for empty input and removes empty URL attributes', () => {
    expect(sanitizeArticleHtmlRaw('   ')).toBeNull()
    expect(sanitizeArticleHtmlRaw('<a href="  ">empty</a>')).toBe('<a>empty</a>')
    expect(sanitizeArticleHtmlRaw('<img src="  " alt="x">')).not.toContain('src=')
  })

  it('rejects credentialed and malformed external links', () => {
    expect(sanitizeArticleHtmlRaw('<a href="https://user@example.com/x">x</a>')).not.toContain(
      'href=',
    )
    expect(sanitizeArticleHtmlRaw('<a href="https://[invalid">x</a>')).not.toContain('href=')
  })

  it('restricts relative anchor targets when a resource pattern is provided', () => {
    const pattern = /^\/resources\/[^"']+$/i
    expect(
      sanitizeArticleHtmlRaw('<a href="/resources/paper.pdf">paper</a>', {
        resourceImgPattern: pattern,
      }),
    ).toContain('href="/resources/paper.pdf"')
    expect(
      sanitizeArticleHtmlRaw('<a href="../private.txt">private</a>', {
        resourceImgPattern: pattern,
      }),
    ).not.toContain('href=')
  })
})

describe('hardenExternalAnchors', () => {
  it('does not duplicate rel when already present', () => {
    const html =
      '<a href="https://a.test" target="_blank" rel="noopener noreferrer">x</a>'
    expect(hardenExternalAnchors(html)).toBe(html)
  })

  it('fills in whichever external-link protection is missing', () => {
    expect(hardenExternalAnchors('<a href="https://a.test" rel="nofollow">x</a>')).toBe(
      '<a href="https://a.test" rel="nofollow" target="_blank">x</a>',
    )
    expect(hardenExternalAnchors('<a href="https://a.test" target="_self">x</a>')).toBe(
      '<a href="https://a.test" target="_self" rel="noopener noreferrer">x</a>',
    )
    expect(hardenExternalAnchors('<a href="/local">x</a>')).toBe('<a href="/local">x</a>')
  })

  it('keeps the rewritten tag well formed so link text is not consumed as attributes', () => {
    expect(hardenExternalAnchors('<a href="https://a.test">OpenAI Five (2018)</a>: tail')).toBe(
      '<a href="https://a.test" rel="noopener noreferrer" target="_blank">OpenAI Five (2018)</a>: tail',
    )
  })
})

describe('stripResidualUnsafeLinks', () => {
  it('drops an unsafe href without leaving stray markup from trailing attributes', () => {
    expect(
      stripResidualUnsafeLinks('<a class="x" href="javascript:alert(1)" title="t">text</a>'),
    ).toBe('<a class="x" title="t">text</a>')
  })

  it('drops an unsafe href that is the only attribute', () => {
    expect(stripResidualUnsafeLinks('<a href="javascript:alert(1)">text</a>')).toBe('<a>text</a>')
  })

  it('leaves safe links and anchors without hrefs untouched', () => {
    const html = '<a href="https://a.test" target="_blank">x</a><a name="top">y</a>'
    expect(stripResidualUnsafeLinks(html)).toBe(html)
  })
})
