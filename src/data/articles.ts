import { githubRepoPairKey } from '../../shared/githubRepo'
import { normalizeHrefKey } from '../../shared/hrefKey'
import {
  buildArticleRouteSlugs,
  decodeHtml,
  sortIndexedArticles,
} from '../../shared/siteArticlesRouting'
import { safeYoutubeId } from '../lib/safeUrls'
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
  /** If set, article page fetches this raw GitHub URL at runtime and renders README markdown. */
  readmeRawUrl: string | null
  extraLinks: { label: string; href: string }[]
}

/** Rows in `siteArticles.json` may omit `readmeRawUrl`. */
type SiteArticleJsonRow = Omit<SiteArticleRow, 'readmeRawUrl'> & { readmeRawUrl?: string | null }

function deriveKind(row: Pick<SiteArticleRow, 'slug' | 'githubEmbed'>): 'app' | 'lesson' | 'post' {
  if (row.githubEmbed) return 'app'
  if (/software-lessons-session/i.test(row.slug)) return 'lesson'
  return 'post'
}

const normalizedRows: SiteArticleRow[] = (siteArticlesData as SiteArticleJsonRow[]).map((row) => ({
  ...row,
  title: decodeHtml(row.title),
  summary: row.summary ? decodeHtml(row.summary) : null,
  imageUrl: row.imageUrl ?? null,
  articleHeroUrl: row.articleHeroUrl ?? null,
  bodyHtml: row.bodyHtml ?? null,
  readmeRawUrl: row.readmeRawUrl ?? null,
}))

type IndexedArticle = SiteArticleRow & { sourceIndex: number }

const indexed: IndexedArticle[] = normalizedRows.map((row, sourceIndex) => ({
  ...row,
  sourceIndex,
}))

const sorted = sortIndexedArticles(indexed)

export type ArticleKind = 'app' | 'lesson' | 'post'

/** `slug` is the public URL segment (from title). `sourceSlug` is the id from `siteArticles.json`. */
export type Article = Omit<SiteArticleRow, 'slug'> & {
  slug: string
  sourceSlug: string
  kind: ArticleKind
  prevSlug: string | null
  nextSlug: string | null
}

const { routeSlugs, legacyRouteSlugs } = buildArticleRouteSlugs(sorted, { titlesDecoded: true })

export const articles: Article[] = sorted.map((row, i) => {
  const { slug: sourceSlug, ...rest } = row
  const slug = routeSlugs[i]!
  return {
    ...rest,
    sourceSlug,
    slug,
    kind: deriveKind(row),
    prevSlug: i > 0 ? routeSlugs[i - 1]! : null,
    nextSlug: i < sorted.length - 1 ? routeSlugs[i + 1]! : null,
  }
})

const bySlug = new Map<string, Article>()
for (const a of articles) {
  bySlug.set(a.slug, a)
}
for (const a of articles) {
  if (a.sourceSlug !== a.slug && !bySlug.has(a.sourceSlug)) {
    bySlug.set(a.sourceSlug, a)
  }
}

for (let i = 0; i < articles.length; i++) {
  const leg = legacyRouteSlugs[i]!
  const a = articles[i]!
  if (leg !== a.slug && !bySlug.has(leg)) {
    bySlug.set(leg, a)
  }
}

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
  const id = safeYoutubeId(youtubeId)
  if (!id) return null
  return `https://www.youtube.com/watch?v=${encodeURIComponent(id)}`
}

function isPdfHref(href: string): boolean {
  return /\.pdf$/i.test(href.split('?')[0].split('#')[0])
}

/** PDF (and similar) links from `extraLinks` for home cards and nav. */
export function pdfExtraLinks(a: Article): { label: string; href: string }[] {
  return filterExtraLinks(a).filter((l) => l?.href && isPdfHref(l.href))
}

export function filterExtraLinks(a: Article) {
  const dk = a.demoUrl ? normalizeHrefKey(a.demoUrl) : null
  const rk = a.repoUrl ? normalizeHrefKey(a.repoUrl) : null
  const repoPair = a.repoUrl ? githubRepoPairKey(a.repoUrl) : null
  return a.extraLinks.filter((l) => {
    const k = normalizeHrefKey(l.href)
    if (dk && k === dk) return false
    if (rk && k === rk) return false
    if (repoPair && githubRepoPairKey(l.href) === repoPair) return false
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
