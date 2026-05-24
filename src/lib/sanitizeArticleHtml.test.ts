import { describe, expect, it } from 'vitest'
import { prepareArticleBodyHtml } from './sanitizeArticleHtml'

describe('prepareArticleBodyHtml', () => {
  it('rewrites resource paths with base and sanitizes', () => {
    const html = '<img src="resources/test.png" alt=""><a href="https://example.com">x</a>'
    const out = prepareArticleBodyHtml(html)
    expect(out).toContain('src="/resources/test.png"')
    expect(out).toContain('target="_blank"')
    expect(out).not.toContain('script')
  })

  it('returns null for empty input', () => {
    expect(prepareArticleBodyHtml(null)).toBeNull()
    expect(prepareArticleBodyHtml('   ')).toBeNull()
  })
})
