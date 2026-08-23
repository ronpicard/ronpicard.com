import { describe, expect, it } from 'vitest'
import { prepareArticleBodyHtml } from './sanitizeArticleHtml'

describe('prepareArticleBodyHtml', () => {
  it('rewrites resource paths with base and sanitizes', () => {
    const html =
      '<img src="resources/test.png" alt=""><a href="https://example.com">x</a><script>alert(1)</script>'
    const out = prepareArticleBodyHtml(html)
    expect(out).toContain('src="/resources/test.png"')
    expect(out).toContain('href="https://example.com"')
    expect(out).toContain('target="_blank"')
    expect(out).not.toContain('<script')
    expect(out).not.toContain('alert(1)')
  })

  it('returns null for empty input', () => {
    expect(prepareArticleBodyHtml(null)).toBeNull()
    expect(prepareArticleBodyHtml('   ')).toBeNull()
  })
})
