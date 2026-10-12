import { escapeXml } from './sitemap.ts'

export type FeedItem = {
  title: string
  url: string
  description: string
  date: string
}

type FeedInput = {
  title: string
  description: string
  siteUrl: string
  feedUrl: string
  items: FeedItem[]
}

function toRfc822(date: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
  const parsed = new Date(`${date}T12:00:00Z`)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toUTCString()
}

export function buildRssFeed({ title, description, siteUrl, feedUrl, items }: FeedInput): string {
  const dated = items.flatMap((item) => {
    const pubDate = toRfc822(item.date)
    return pubDate ? [{ item, pubDate, time: Date.parse(pubDate) }] : []
  })
  const newest = dated.reduce<(typeof dated)[number] | null>(
    (best, entry) => (!best || entry.time > best.time ? entry : best),
    null,
  )
  const lastBuild = newest ? `\n    <lastBuildDate>${escapeXml(newest.pubDate)}</lastBuildDate>` : ''
  const entries = dated
    .map(
      ({ item, pubDate }) =>
        `    <item>\n      <title>${escapeXml(item.title)}</title>\n      <link>${escapeXml(item.url)}</link>\n      <guid isPermaLink="true">${escapeXml(item.url)}</guid>\n      <pubDate>${escapeXml(pubDate)}</pubDate>\n      <description>${escapeXml(item.description)}</description>\n    </item>`,
    )
    .join('\n')
  const body = entries ? `\n${entries}` : ''
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n  <channel>\n    <title>${escapeXml(title)}</title>\n    <link>${escapeXml(siteUrl)}</link>\n    <description>${escapeXml(description)}</description>\n    <language>en-us</language>${lastBuild}\n    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />${body}\n  </channel>\n</rss>\n`
}
