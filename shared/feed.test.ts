import { describe, expect, it } from 'vitest'
import { buildRssFeed } from './feed'

const base = {
  title: 'Ron & Co',
  description: 'Posts <latest>',
  siteUrl: 'https://ronpicard.com/',
  feedUrl: 'https://ronpicard.com/feed.xml',
}

describe('rss feed output', () => {
  it('escapes XML in titles and descriptions', () => {
    const xml = buildRssFeed({
      ...base,
      items: [
        {
          title: 'A & B',
          url: 'https://ronpicard.com/blog/a/',
          description: 'x < y',
          date: '2026-10-03',
        },
      ],
    })
    expect(xml).toContain('<title>A &amp; B</title>')
    expect(xml).toContain('<description>x &lt; y</description>')
    expect(xml).toContain('<title>Ron &amp; Co</title>')
  })

  it('formats pubDate as RFC 822 and marks the guid as a permalink', () => {
    const xml = buildRssFeed({
      ...base,
      items: [
        {
          title: 'A',
          url: 'https://ronpicard.com/blog/a/',
          description: 'd',
          date: '2026-10-03',
        },
      ],
    })
    expect(xml).toContain('<pubDate>Sat, 03 Oct 2026 12:00:00 GMT</pubDate>')
    expect(xml).toContain('<guid isPermaLink="true">https://ronpicard.com/blog/a/</guid>')
  })

  it('uses the newest item date for lastBuildDate even when unsorted', () => {
    const xml = buildRssFeed({
      ...base,
      items: [
        { title: 'Old', url: 'https://ronpicard.com/blog/old/', description: 'd', date: '2026-01-05' },
        { title: 'New', url: 'https://ronpicard.com/blog/new/', description: 'd', date: '2026-10-03' },
        { title: 'Mid', url: 'https://ronpicard.com/blog/mid/', description: 'd', date: '2026-05-01' },
      ],
    })
    expect(xml).toContain('<lastBuildDate>Sat, 03 Oct 2026 12:00:00 GMT</lastBuildDate>')
    expect(xml.indexOf('>Old<')).toBeLessThan(xml.indexOf('>New<'))
  })

  it('omits lastBuildDate when there are no items', () => {
    const xml = buildRssFeed({ ...base, items: [] })
    expect(xml).not.toContain('lastBuildDate')
    expect(xml).not.toContain('<item>')
  })

  it('skips items with invalid dates', () => {
    const xml = buildRssFeed({
      ...base,
      items: [
        { title: 'Bad format', url: 'https://ronpicard.com/blog/x/', description: 'd', date: '10/03/2026' },
        { title: 'Bad date', url: 'https://ronpicard.com/blog/y/', description: 'd', date: '2026-13-45' },
        { title: 'Good', url: 'https://ronpicard.com/blog/z/', description: 'd', date: '2026-10-03' },
      ],
    })
    expect(xml).not.toContain('Bad format')
    expect(xml).not.toContain('Bad date')
    expect(xml).toContain('<title>Good</title>')
  })

  it('includes the atom self link and RSS envelope', () => {
    const xml = buildRssFeed({ ...base, items: [] })
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0"')).toBe(true)
    expect(xml).toContain(
      '<atom:link href="https://ronpicard.com/feed.xml" rel="self" type="application/rss+xml" />',
    )
    expect(xml).toContain('<language>en-us</language>')
    expect(xml.endsWith('</rss>\n')).toBe(true)
  })
})
