import { describe, expect, it } from 'vitest'
import { RESOURCE_THUMBS_DIR, resourceThumbPath, THUMB_WIDTH } from './resourceThumbs'

describe('resourceThumbPath', () => {
  it('maps a mirrored resource image to its webp thumbnail path', () => {
    expect(resourceThumbPath('resources/8481cf2cdc0be5.png')).toBe(
      'resources/thumbs/8481cf2cdc0be5.webp',
    )
    expect(resourceThumbPath('resources/fm-stock-formal-systems.jpg')).toBe(
      'resources/thumbs/fm-stock-formal-systems.webp',
    )
    expect(resourceThumbPath('resources/photo.v2.jpeg')).toBe('resources/thumbs/photo.v2.webp')
  })

  it('trims surrounding whitespace', () => {
    expect(resourceThumbPath('  resources/a1.png  ')).toBe('resources/thumbs/a1.webp')
  })

  it('rejects non-image and non-local paths', () => {
    expect(resourceThumbPath('resources/paper.pdf')).toBeNull()
    expect(resourceThumbPath('resources/notes.txt')).toBeNull()
    expect(resourceThumbPath('article-bodies/a.html')).toBeNull()
    expect(resourceThumbPath('https://img.youtube.com/vi/abc123/maxresdefault.jpg')).toBeNull()
    expect(resourceThumbPath('resources/../secret.png')).toBeNull()
    expect(resourceThumbPath('resources/')).toBeNull()
    expect(resourceThumbPath('')).toBeNull()
    expect(resourceThumbPath(null)).toBeNull()
    expect(resourceThumbPath(undefined)).toBeNull()
  })

  it('exposes the thumbnail directory and target width used by the build script', () => {
    expect(RESOURCE_THUMBS_DIR).toBe('resources/thumbs')
    expect(THUMB_WIDTH).toBeGreaterThanOrEqual(640)
  })
})
