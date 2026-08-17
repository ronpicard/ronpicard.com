import { describe, expect, it } from 'vitest'
import { getViteBasePath, resolveAssetUrl, resolveResourcePathsInHtml } from './assetUrl'

describe('resolveAssetUrl', () => {
  it('passes through absolute http(s) URLs', () => {
    expect(resolveAssetUrl('https://example.com/a.png')).toBe('https://example.com/a.png')
  })

  it('prefixes relative paths with Vite base', () => {
    const base = getViteBasePath()
    expect(resolveAssetUrl('resources/x.png')).toBe(`${base}/resources/x.png`)
  })

  it('returns null for empty input', () => {
    expect(resolveAssetUrl(null)).toBeNull()
    expect(resolveAssetUrl('')).toBeNull()
  })
})

describe('resolveResourcePathsInHtml', () => {
  it('rewrites resources/ src and href attributes', () => {
    const base = getViteBasePath()
    const out = resolveResourcePathsInHtml('<img src="resources/a.png"><a href="resources/b.pdf">x</a>')
    expect(out).toContain(`src="${base}/resources/a.png"`)
    expect(out).toContain(`href="${base}/resources/b.pdf"`)
  })

  it('returns null for empty input', () => {
    expect(resolveResourcePathsInHtml(null)).toBeNull()
    expect(resolveResourcePathsInHtml('')).toBeNull()
  })
})
