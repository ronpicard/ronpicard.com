import { describe, expect, it } from 'vitest'
import {
  getViteBasePath,
  isSafeLocalAssetPath,
  resolveAssetUrl,
  resolveReadmeSnapshotUrl,
  resolveResourcePathsInHtml,
  resolveThumbAssetUrl,
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

describe('resolveThumbAssetUrl', () => {
  it('builds a base-prefixed thumbnail URL for mirrored images', () => {
    const base = getViteBasePath()
    expect(resolveThumbAssetUrl('resources/card.png')).toBe(
      `${base}/resources/thumbs/card.webp`,
    )
  })

  it('returns null for external URLs, non-images, and empty input', () => {
    expect(
      resolveThumbAssetUrl('https://img.youtube.com/vi/Glhr3OIjwsI/maxresdefault.jpg'),
    ).toBeNull()
    expect(resolveThumbAssetUrl('resources/paper.pdf')).toBeNull()
    expect(resolveThumbAssetUrl(null)).toBeNull()
    expect(resolveThumbAssetUrl('')).toBeNull()
  })
})

describe('resolveReadmeSnapshotUrl', () => {
  it('builds a base-prefixed snapshot path for valid slugs', () => {
    const base = getViteBasePath()
    expect(resolveReadmeSnapshotUrl('clamav-antivirus-control-gui')).toBe(
      `${base}/readme-snapshots/clamav-antivirus-control-gui.md`,
    )
  })

  it('rejects traversal, invalid characters, and empty input', () => {
    expect(resolveReadmeSnapshotUrl('../etc/passwd')).toBeNull()
    expect(resolveReadmeSnapshotUrl('bad_slug')).toBeNull()
    expect(resolveReadmeSnapshotUrl('')).toBeNull()
    expect(resolveReadmeSnapshotUrl(null)).toBeNull()
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
