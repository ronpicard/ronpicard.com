import siteArticlesData from './siteArticles.json'

type SiteArticleRow = {
  slug: string
  title: string
  date: string
  summary: string | null
  bodyHtml: string | null
  imageUrl: string | null
  /** Leading Squarespace image block URL when live site shows a banner above body (null = no banner). */
  articleHeroUrl: string | null
  githubEmbed: string | null
  demoUrl: string | null
  repoUrl: string | null
  youtubeId: string | null
  otherEmbed: string | null
  extraLinks: { label: string; href: string }[]
}

function decodeHtml(raw: string): string {
  return raw
    .replace(/&mdash;/gi, '—')
    .replace(/&ndash;/gi, '–')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s*[—–]\s*Home\s*$/i, '')
    .trim()
}

function deriveKind(row: Pick<SiteArticleRow, 'slug' | 'githubEmbed'>): 'app' | 'lesson' | 'post' {
  if (row.githubEmbed) return 'app'
  if (/software-lessons-session/i.test(row.slug)) return 'lesson'
  return 'post'
}

const normalizedRows: SiteArticleRow[] = (siteArticlesData as SiteArticleRow[]).map((row) => ({
  ...row,
  title: decodeHtml(row.title),
  summary: row.summary ? decodeHtml(row.summary) : null,
  imageUrl: row.imageUrl ?? null,
  articleHeroUrl: row.articleHeroUrl ?? null,
  bodyHtml: row.bodyHtml ?? null,
}))

const sorted = [...normalizedRows].sort((a, b) => {
  const byDate = b.date.localeCompare(a.date)
  if (byDate !== 0) return byDate
  return a.slug.localeCompare(b.slug)
})

export type ArticleKind = 'app' | 'lesson' | 'post'

export type Article = SiteArticleRow & {
  kind: ArticleKind
  prevSlug: string | null
  nextSlug: string | null
}

export const articles: Article[] = sorted.map((row, i) => ({
  ...row,
  kind: deriveKind(row),
  prevSlug: sorted[i - 1]?.slug ?? null,
  nextSlug: sorted[i + 1]?.slug ?? null,
}))

const bySlug = new Map(articles.map((a) => [a.slug, a]))

export function getArticle(slug: string): Article | undefined {
  return bySlug.get(slug)
}

export function showDemoButton(a: Article): boolean {
  return !!a.demoUrl
}

export function showCodeButton(a: Article): boolean {
  return !!a.repoUrl
}

export function isThirdPartyArticleLink(link: { label: string; href: string }): boolean {
  const href = link.href.trim()
  if (!/^https?:\/\//i.test(href)) return false

  let u: URL
  try {
    u = new URL(href)
  } catch {
    return false
  }

  const host = u.hostname.toLowerCase()
  const path = `${u.pathname}${u.search}`

  if (/(^|\.)youtube\.com$|^youtu\.be$/i.test(host)) return false
  if (host === 'github.com' || host === 'gist.github.com') return false
  if (host.endsWith('.github.io')) return false

  const label = link.label.trim().toLowerCase()
  if (/\bvideo\b/.test(label) && !/\barticle\b/.test(label)) return false

  if (/\b(paper|view article|publication|journal|proceedings|manuscript)\b/.test(label)) return true
  if (/\barticle\b/.test(label)) return true

  if (
    /(^|\.)doi\.org$/i.test(host) ||
    /^arxiv\.org$/i.test(host) ||
    host.endsWith('.ieee.org') ||
    host === 'ieee.org' ||
    /(^|\.)nature\.com$/i.test(host) ||
    /sciencedirect/i.test(host) ||
    /springer/i.test(host) ||
    /mdpi\.com$/i.test(host) ||
    (/\.aiaa\.org$/i.test(host) && /\/doi\//i.test(path))
  ) {
    return true
  }

  if (/\.af\.mil$/i.test(host) && /\/article/i.test(path)) return true
  if (/aviationweek\.com/i.test(host)) return true

  return false
}

export function youtubeWatchUrl(youtubeId: string | null | undefined): string | null {
  if (!youtubeId?.trim()) return null
  return `https://www.youtube.com/watch?v=${encodeURIComponent(youtubeId.trim())}`
}

function isPdfHref(href: string): boolean {
  return /\.pdf$/i.test(href.split('?')[0].split('#')[0])
}

/** PDF (and similar) links from `extraLinks` for home cards and nav. */
export function pdfExtraLinks(a: Article): { label: string; href: string }[] {
  return filterExtraLinks(a).filter((l) => l?.href && isPdfHref(l.href))
}

function hrefKey(href: string) {
  try {
    const u = new URL(href.trim())
    u.hash = ''
    const p = u.pathname.replace(/\/$/, '') || '/'
    return `${u.origin}${p}`.toLowerCase()
  } catch {
    return href.trim().replace(/\/$/, '').toLowerCase()
  }
}

export function filterExtraLinks(a: Article) {
  const dk = a.demoUrl ? hrefKey(a.demoUrl) : null
  const rk = a.repoUrl ? hrefKey(a.repoUrl) : null
  return a.extraLinks.filter((l) => {
    const k = hrefKey(l.href)
    if (dk && k === dk) return false
    if (rk && k === rk) return false
    return true
  })
}

/** First `extraLinks` URL that points at a third-party article (not on-site PDFs or demos). */
export function thirdPartyArticleUrl(a: Article): string | null {
  for (const l of filterExtraLinks(a)) {
    if (!l?.href?.trim()) continue
    if (isThirdPartyArticleLink(l)) return l.href.trim()
  }
  return null
}

export function getArticleTitleList() {
  return articles.map((a) => ({
    slug: a.slug,
    title: a.title,
    date: a.date,
    kind: a.kind,
    imageUrl: a.imageUrl,
    showDemo: showDemoButton(a),
    showCode: showCodeButton(a),
    articleUrl: thirdPartyArticleUrl(a),
    demoUrl: a.demoUrl,
    repoUrl: a.repoUrl,
    videoUrl: youtubeWatchUrl(a.youtubeId),
    pdfLinks: pdfExtraLinks(a),
  }))
}
