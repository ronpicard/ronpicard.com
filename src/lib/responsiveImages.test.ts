// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { getViteBasePath } from './assetUrl'
import { addResponsiveImageAttrs, BODY_IMAGE_SIZES, enhanceBodyImages } from './responsiveImages'

describe('addResponsiveImageAttrs', () => {
  it('adds srcset, sizes, lazy loading and async decoding to local raster images', () => {
    const base = getViteBasePath()
    const out = addResponsiveImageAttrs(`<p>x</p><img alt="A" src="${base}/resources/a.jpg"><img src="resources/b.png">`)
    const root = document.createElement('div')
    root.innerHTML = out
    const [a, b] = root.querySelectorAll('img')
    expect(a.getAttribute('srcset')).toBe(
      `${base}/resources/sized/a-768.webp 768w, ${base}/resources/sized/a-1280.webp 1280w, ${base}/resources/sized/a-1920.webp 1920w`,
    )
    expect(b.getAttribute('srcset')).toContain('resources/sized/b-1920.webp 1920w')
    expect(a.getAttribute('sizes')).toBe(BODY_IMAGE_SIZES)
    expect(a.getAttribute('loading')).toBe('lazy')
    expect(a.getAttribute('decoding')).toBe('async')
    expect(a.getAttribute('alt')).toBe('A')
  })

  it('leaves svg, gif, external, and already-responsive images as written', () => {
    const html =
      '<img src="/resources/a.svg"><img src="/resources/a.gif"><img src="https://x.test/a.png">' +
      '<img src="/resources/c.png" loading="eager"><img alt="no src">'
    expect(addResponsiveImageAttrs(html)).toBe(html)
  })
})

describe('enhanceBodyImages', () => {
  function render(html: string) {
    const root = document.createElement('div')
    root.innerHTML = addResponsiveImageAttrs(html)
    return root
  }

  it('drops srcset and sizes when a generated copy fails to load', () => {
    const root = render('<img src="/resources/a.png">')
    const cleanup = enhanceBodyImages(root)
    const img = root.querySelector('img')!
    img.dispatchEvent(new Event('error'))
    expect(img.hasAttribute('srcset')).toBe(false)
    expect(img.hasAttribute('sizes')).toBe(false)
    expect(img.getAttribute('loading')).toBe('lazy')
    cleanup()
  })

  it('falls back at once for an image that already failed before it ran', () => {
    const root = render('<img src="/resources/a.png">')
    const img = root.querySelector('img')!
    Object.defineProperties(img, {
      complete: { value: true },
      naturalWidth: { value: 0 },
      currentSrc: { value: '/resources/sized/a-768.webp' },
    })
    enhanceBodyImages(root)
    expect(img.hasAttribute('srcset')).toBe(false)
  })

  it('keeps srcset after cleanup and ignores later errors', () => {
    const root = render('<img src="/resources/a.png">')
    enhanceBodyImages(root)()
    const img = root.querySelector('img')!
    img.dispatchEvent(new Event('error'))
    expect(img.hasAttribute('srcset')).toBe(true)
  })
})
