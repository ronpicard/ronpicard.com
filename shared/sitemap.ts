type SitemapEntry = {
  url: string
  lastModified?: string | null
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function buildSitemapXml(entries: SitemapEntry[]): string {
  const urls = entries
    .map(({ url, lastModified }) => {
      const lastmod = lastModified ? `\n    <lastmod>${escapeXml(lastModified)}</lastmod>` : ''
      return `  <url>\n    <loc>${escapeXml(url)}</loc>${lastmod}\n  </url>`
    })
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

export function buildRobotsTxt(sitemapUrl: string): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl}\n`
}
