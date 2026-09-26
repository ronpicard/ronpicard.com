import { describe, expect, it } from 'vitest'
import { postShareImage, resourceOgPath } from './resourceOgImages'

describe('resourceOgPath', () => {
  it('maps a mirrored resource image to its jpeg share card path', () => {
    expect(resourceOgPath('resources/8481cf2cdc0be5.png')).toBe('resources/og/8481cf2cdc0be5.jpg')
    expect(resourceOgPath('  resources/photo.v2.jpeg  ')).toBe('resources/og/photo.v2.jpg')
  })

  it('rejects non-image and non-local paths', () => {
    expect(resourceOgPath('resources/paper.pdf')).toBeNull()
    expect(resourceOgPath('https://img.youtube.com/vi/abc123/maxresdefault.jpg')).toBeNull()
    expect(resourceOgPath('resources/../secret.png')).toBeNull()
    expect(resourceOgPath('')).toBeNull()
    expect(resourceOgPath(null)).toBeNull()
    expect(resourceOgPath(undefined)).toBeNull()
  })
})

describe('postShareImage', () => {
  it('prefers the article hero over the title image', () => {
    expect(postShareImage({ articleHeroUrl: 'resources/hero.jpg', imageUrl: 'resources/t.png' })).toBe(
      'resources/hero.jpg',
    )
    expect(postShareImage({ articleHeroUrl: null, imageUrl: 'resources/t.png' })).toBe('resources/t.png')
    expect(postShareImage({})).toBeNull()
  })
})
