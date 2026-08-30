import { describe, expect, it } from 'vitest'
import { getArticleTitleList } from './data/articles'
import { render } from './entry-server'

describe('entry-server render', () => {
  it('renders the homepage card grid to HTML', async () => {
    const { appHtml } = await render('/')
    expect(appHtml).toContain('My projects')
    // Every article card is present in the prerendered markup.
    const cardCount = (appHtml.match(/class="project-card"/g) || []).length
    expect(cardCount).toBe(getArticleTitleList().length)
    // Above-the-fold images load eagerly; the rest stay lazy.
    expect(appHtml).toContain('loading="eager"')
    expect(appHtml).toContain('loading="lazy"')
    expect(appHtml).toContain('/resources/thumbs/')
  })

  it('hoists priority-image preloads out of the body markup', async () => {
    const { appHtml, preloadLinks } = await render('/')
    expect(preloadLinks).toContain('rel="preload"')
    expect(preloadLinks).toContain('/resources/thumbs/')
    // Head-only tags must not leak into #root: prerender owns the head.
    expect(appHtml.startsWith('<div class="app-content"')).toBe(true)
    expect(appHtml).not.toContain('<title>')
    expect(appHtml).not.toContain('<meta ')
    // Static output only: streaming placeholders/scripts break hydration
    // under the site CSP (script-src 'self' blocks the inline swap scripts),
    // and JSON-LD lives in <head> via prerender, never in the app tree.
    expect(appHtml).not.toContain('<!--$?-->')
    expect(appHtml).not.toContain('<template')
    expect(appHtml).not.toContain('<script')
  })

  it('renders an article page shell for a known slug', async () => {
    const first = getArticleTitleList()[0]!
    const { appHtml } = await render(`/blog/${first.slug}/`)
    expect(appHtml.startsWith('<div class="app-content"')).toBe(true)
    expect(appHtml).toContain('page--article')
    expect(appHtml).toContain('article-header__title')
  })
})
