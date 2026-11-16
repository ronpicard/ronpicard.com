import { describe, expect, it } from 'vitest'
import { resourceSizedPath, resourceSrcSet, SIZED_WIDTHS } from './resourceSized'

describe('resourceSizedPath', () => {
  it('maps local raster images to sized webp names', () => {
    expect(resourceSizedPath('resources/a-b.PNG', 1280)).toBe('resources/sized/a-b-1280.webp')
    expect(resourceSizedPath('resources/x.jpeg', 768)).toBe('resources/sized/x-768.webp')
    expect(resourceSizedPath('resources/x.webp', 1920)).toBe('resources/sized/x-1920.webp')
  })

  it('rejects gif, svg, pdf, external, traversal, and empty input', () => {
    for (const p of [
      'resources/a.gif',
      'resources/a.svg',
      'resources/a.pdf',
      'https://example.com/a.png',
      'resources/../a.png',
      'resources/sub/a.png',
      '',
      null,
      undefined,
    ]) {
      expect(resourceSizedPath(p, 768)).toBeNull()
    }
  })
})

describe('resourceSrcSet', () => {
  it('lists every width with the resolver applied', () => {
    const set = resourceSrcSet('resources/a.png', (p) => `/base/${p}`)
    expect(set).toBe(
      SIZED_WIDTHS.map((w) => `/base/resources/sized/a-${w}.webp ${w}w`).join(', '),
    )
  })

  it('returns null for non-raster paths', () => {
    expect(resourceSrcSet('resources/a.svg', (p) => p)).toBeNull()
    expect(resourceSrcSet(null, (p) => p)).toBeNull()
  })
})
