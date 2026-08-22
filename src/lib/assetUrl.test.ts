import { describe, expect, it } from 'vitest'
import {
  getViteBasePath,
  isSafeLocalAssetPath,
  resolveAssetUrl,
  resolveResourcePathsInHtml,
} from './assetUrl'

describe('resolveAssetUrl', () => {
  it('only permits allowlisted external thumbnails', () => {
    expect(resolveAssetUrl('https://img.youtube.com/vi/Glhr3OIjwsI/maxresdefault.jpg')).toBe(
      'https://img.youtube.com/vi/Glhr3OIjwsI/maxresdefault.jpg',
    )
    expect(resolveAssetUrl('https://example.com/a.png')).toBeNull()
    expect(resolveAssetUrl('http://img.youtube.com/vi/Glhr3OIjwsI/maxresdefault.jpg')).toBeNull()
  })

  it('prefixes relative paths with Vite base', () => {
    const base = getViteBasePath()
    expect(resolveAssetUrl('resources/x.png')).toBe(`${base}/resources/x.png`)
    expect(resolveAssetUrl('article-bodies/example.html')).toBe(
      `${base}/article-bodies/example.html`,
    )
  })

  it('rejects traversal and protocol-relative local paths', () => {
    expect(resolveAssetUrl('../secret.txt')).toBeNull()
    expect(resolveAssetUrl('//evil.example/x.png')).toBeNull()
    expect(resolveAssetUrl('/resources/x.png')).toBeNull()
    expect(isSafeLocalAssetPath('resources/x.png')).toBe(true)
    expect(isSafeLocalAssetPath('resources/../x.png')).toBe(false)
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
