import { githubRepoPairKey } from '../../shared/githubRepo'
import { normalizeHrefKey } from '../../shared/hrefKey'
import {
  buildArticleRouteSlugs,
  decodeHtml,
  sortIndexedArticles,
} from '../../shared/siteArticlesRouting'
import {
  parseSiteArticleRows,
  type SiteArticleRow as IngestedSiteArticleRow,
} from '../../shared/siteArticleSchema'
import { isPdfHref } from '../lib/linkBrand'
import { safeGithubReleasesUrl, safeYoutubeId } from '../lib/safeUrls'
import siteArticlesData from './siteArticles.json'

type SiteArticleRow = Omit<
  IngestedSiteArticleRow,
  'bodyHtml' | 'bodyPath' | 'readmeRawUrl' | 'releasesUrl'
> & {
  bodyPath: string | null
  readmeRawUrl: string | null
  releasesUrl: string | null
}

function deriveKind(
  row: Pick<SiteArticleRow, 'slug' | 'title' | 'githubEmbed' | 'releasesUrl' | 'bodyPath'>,
): ArticleKind {
  if (row.githubEmbed) return 'app'
  // A written article about released software stays an article.
  if (row.releasesUrl && !row.bodyPath) return 'software'
  // Some lessons keep Squarespace storage slugs, so the title decides too.
  if (/software-lessons-session/i.test(row.slug) || /^Software Lessons Session\b/i.test(row.title)) {
    return 'lesson'
  }
  return 'post'
}

const normalizedRows: SiteArticleRow[] = parseSiteArticleRows(siteArticlesData).map(
  ({ bodyHtml: _bodyHtml, ...row }) => ({
    ...row,
    title: decodeHtml(row.title),
    summary: row.summary ? decodeHtml(row.summary) : null,
    bodyPath: row.bodyPath ?? null,
    readmeRawUrl: row.readmeRawUrl ?? null,
    releasesUrl: row.releasesUrl ?? null,
  }),
)

type IndexedArticle = SiteArticleRow & { sourceIndex: number }

const indexed: IndexedArticle[] = normalizedRows.map((row, sourceIndex) => ({
  ...row,
  sourceIndex,
}))

const sorted = sortIndexedArticles(indexed)

/** `app` = embedded web app; `software` = downloadable app shipped as GitHub releases, without a written article. */
export type ArticleKind = 'app' | 'software' | 'lesson' | 'post'

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

/** Releases button: only for posts whose JSON names a valid GitHub releases page. */
export function showReleasesButton(a: Article): boolean {
  return !!safeGithubReleasesUrl(a.releasesUrl)
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

/**
 * Button text for an extra link: papers read "Paper", other third-party articles (news stories
 * and the like) read "Article", and a blank label falls back.
 */
function extraLinkLabel(label: string, href: string, articleStyle: boolean): string {
  const t = label.trim()
  if (/^view paper$/i.test(t)) return 'Paper'
  if (articleStyle && !/\bpaper\b/i.test(t)) return 'Article'
  return t || (isPdfHref(href) ? 'PDF' : 'Link')
}

export type ArticleExtraLink = {
  label: string
  href: string
  /** Third-party article or paper, styled like an article link. */
  articleStyle: boolean
}

/** Every extra link button a post shows, identically on its home card and its article page. */
export function articleExtraLinks(a: Article): ArticleExtraLink[] {
  return filterExtraLinks(a)
    .filter((l) => l?.href?.trim())
    .map((l) => {
      const articleStyle = isThirdPartyArticleLink(l)
      return { label: extraLinkLabel(l.label, l.href, articleStyle), href: l.href.trim(), articleStyle }
    })
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
    demoUrl: a.demoUrl,
    repoUrl: a.repoUrl,
    releasesUrl: showReleasesButton(a) ? a.releasesUrl : null,
    videoUrl: youtubeWatchUrl(a.youtubeId),
    extraLinks: articleExtraLinks(a),
  }))
}
