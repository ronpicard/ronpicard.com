// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { articleSeoInput, homeSeoInput } from '../../shared/seoHead'

// Seo remembers whether it has handled the first route, so each test loads a fresh copy.
let Seo: typeof import('./Seo').Seo

let container: HTMLDivElement
let root: Root

const post = {
  slug: 'example-post',
  title: 'Example Post',
  summary: 'Example summary',
  date: '2026-08-22',
  imageUrl: null,
  youtubeId: null,
  repoUrl: null,
}

beforeEach(async () => {
  vi.resetModules()
  ;({ Seo } = await import('./Seo'))
  ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
    .IS_REACT_ACT_ENVIRONMENT = true
  // What a prerendered page ships in <head>, plus a tag Seo does not own.
  document.head.innerHTML = [
    '<meta charset="UTF-8">',
    '<title>Prerendered</title>',
    '<meta name="description" content="prerendered">',
    '<link rel="canonical" href="https://ronpicard.com/">',
    '<meta property="og:title" content="Prerendered">',
    '<meta property="og:image:width" content="999">',
    '<script type="application/ld+json">{"@type":"WebSite"}</script>',
  ].join('')
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

const count = (selector: string) => document.head.querySelectorAll(selector).length

describe('Seo', () => {
  it('keeps a prerendered head that matches the first route', () => {
    const home = homeSeoInput()
    document.head.querySelector('title')!.textContent = home.title
    act(() => root.render(<Seo input={home} />))

    // Untouched: the prerendered image width (unknown to the client) survives.
    expect(document.head.querySelector('meta[property="og:image:width"]')?.getAttribute('content')).toBe('999')
    expect(count('title')).toBe(1)
  })

  it('replaces a prerendered head for another page, such as 404.html', () => {
    act(() => root.render(<Seo input={homeSeoInput()} />))

    expect(count('title')).toBe(1)
    expect(count('meta[name="description"]')).toBe(1)
    expect(count('link[rel="canonical"]')).toBe(1)
    expect(count('meta[property="og:title"]')).toBe(1)
    expect(count('script[type="application/ld+json"]')).toBe(1)
    // Unknown home image size client-side: the stale prerendered width goes away.
    expect(count('meta[property="og:image:width"]')).toBe(0)
    expect(count('meta[charset]')).toBe(1)
    expect(container.innerHTML).toBe('')
  })

  it('swaps every tag, including JSON-LD, on client navigation', () => {
    act(() => root.render(<Seo input={homeSeoInput()} />))
    act(() => root.render(<Seo input={articleSeoInput(post)} />))

    expect(document.title).toBe('Example Post | Ron Picard')
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://ronpicard.com/blog/example-post/',
    )
    expect(
      document.head.querySelector('meta[property="article:published_time"]')?.getAttribute('content'),
    ).toBe('2026-08-22T12:00:00.000Z')
    const scripts = document.head.querySelectorAll('script[type="application/ld+json"]')
    expect(scripts).toHaveLength(1)
    expect(scripts[0]!.textContent).toContain('"BlogPosting"')
    expect(count('meta[name="description"]')).toBe(1)
  })
})
