import { describe, expect, it } from 'vitest'
import { buildRobotsTxt, buildSitemapXml } from './sitemap'

describe('sitemap output', () => {
  it('includes canonical URLs, dates, and escaped XML', () => {
    const xml = buildSitemapXml([
      { url: 'https://ronpicard.com/' },
      { url: 'https://ronpicard.com/blog/a&b', lastModified: '2026-08-22' },
    ])
    expect(xml).toContain('<loc>https://ronpicard.com/</loc>')
    expect(xml).toContain('<loc>https://ronpicard.com/blog/a&amp;b</loc>')
    expect(xml).toContain('<lastmod>2026-08-22</lastmod>')
  })

  it('points crawlers at the sitemap', () => {
    expect(buildRobotsTxt('https://ronpicard.com/sitemap.xml')).toContain(
      'Sitemap: https://ronpicard.com/sitemap.xml',
    )
  })
})
