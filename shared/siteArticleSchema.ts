import { isArticleTopicSlug, type ArticleTopicSlug } from './articleTopics.ts'

export type SiteArticleLink = {
  label: string
  href: string
  /** Legacy flag with no effect: home cards now show every link the article page shows. */
  card?: boolean
  /** The product's own site: its button comes first, before Demo, Code, and Releases. */
  lead?: boolean
}

export type SiteArticleRow = {
  slug: string
  title: string
  date: string
  summary: string | null
  bodyHtml?: string | null
  bodyPath?: string | null
  imageUrl: string | null
  articleHeroUrl: string | null
  githubEmbed: string | null
  demoUrl: string | null
  repoUrl: string | null
  youtubeId: string | null
  otherEmbed: string | null
  readmeRawUrl?: string | null
  /** GitHub releases page (e.g. `.../releases/latest`) for posts whose repo publishes releases. */
  releasesUrl?: string | null
  extraLinks: SiteArticleLink[]
  /** Topic hub; omitted rows use their kind's default topic. */
  topic?: ArticleTopicSlug
  /** Search-friendly title for <title> and share tags; the visible title stays `title`. */
  seoTitle?: string
  /** Thin post: kept on the site but marked noindex and left out of the sitemap. */
  noindex?: boolean
  /** Membership in a numbered series, e.g. Formal Methods 101 part 4. */
  series?: SiteArticleSeries
  /** A video shown at the top of the article in place of its picture. */
  video?: SiteArticleVideo
  /** Featured: shown first on the home page as a large, full-width card. */
  pinned?: boolean
  /** Headline shown above a pinned post's card, e.g. "Download BotLegger: …". */
  pinnedTitle?: string
}

export type SiteArticleVideo = {
  /** https MP4 on an allowlisted host (checked again at render time). */
  src: string
  /** Local poster image, `resources/...`. */
  poster: string
  /** What the video shows, for screen readers. */
  label: string
}

export type SiteArticleSeries = {
  name: string
  part: number
}

const SERIES_NAME_MAX = 80
const PINNED_TITLE_MAX = 120

const VIDEO_POSTER_RE = /^resources\/[a-z0-9][a-z0-9._-]*\.(?:webp|png|jpe?g)$/i

function parseVideo(value: unknown, path: string): SiteArticleVideo {
  const video = recordAt(value, path)
  const src = requiredString(video, 'src', path).trim()
  const poster = requiredString(video, 'poster', path).trim()
  const label = requiredString(video, 'label', path).trim()
  if (!/^https:\/\/[^\s"'<>]+\.mp4$/i.test(src)) throw new Error(`${path}.src must be an https MP4 URL`)
  if (!VIDEO_POSTER_RE.test(poster)) throw new Error(`${path}.poster must be a local resources image`)
  if (!label) throw new Error(`${path}.label must not be blank`)
  return { src, poster, label }
}

function parseSeries(value: unknown, path: string): SiteArticleSeries {
  const series = recordAt(value, path)
  const name = series.name
  const part = series.part
  if (typeof name !== 'string' || !name.trim() || name.trim().length > SERIES_NAME_MAX) {
    throw new Error(`${path}.name must be a non-blank string of at most ${SERIES_NAME_MAX} characters`)
  }
  if (typeof part !== 'number' || !Number.isInteger(part) || part < 1) {
    throw new Error(`${path}.part must be a positive integer`)
  }
  return { name: name.trim(), part }
}

const SLUG_RE = /^[a-z0-9][a-z0-9._-]*$/i
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const ARTICLE_BODY_PATH_RE = /^article-bodies\/[a-z0-9._-]+\.html$/i

function recordAt(value: unknown, path: string): Record<string, unknown> {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${path} must be an object`)
  }
  return value as Record<string, unknown>
}

function requiredString(row: Record<string, unknown>, key: string, path: string): string {
  const value = row[key]
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${path}.${key} must be a non-empty string`)
  }
  return value
}

function nullableString(
  row: Record<string, unknown>,
  key: string,
  path: string,
): string | null {
  const value = row[key]
  if (value == null) return null
  if (typeof value !== 'string') throw new Error(`${path}.${key} must be a string or null`)
  return value
}

function optionalNullableString(
  row: Record<string, unknown>,
  key: string,
  path: string,
): string | null | undefined {
  if (!(key in row)) return undefined
  return nullableString(row, key, path)
}

function parseExtraLinks(value: unknown, path: string): SiteArticleLink[] {
  if (!Array.isArray(value)) throw new Error(`${path} must be an array`)
  return value.map((candidate, index) => {
    const linkPath = `${path}[${index}]`
    const link = recordAt(candidate, linkPath)
    if ('card' in link && typeof link.card !== 'boolean') {
      throw new Error(`${linkPath}.card must be a boolean`)
    }
    if ('lead' in link && typeof link.lead !== 'boolean') {
      throw new Error(`${linkPath}.lead must be a boolean`)
    }
    return {
      label: requiredString(link, 'label', linkPath),
      href: requiredString(link, 'href', linkPath),
      ...(typeof link.card === 'boolean' ? { card: link.card } : {}),
      ...(link.lead === true ? { lead: true } : {}),
    }
  })
}

export function parseSiteArticleRows(
  value: unknown,
  context = 'site article data',
): SiteArticleRow[] {
  if (!Array.isArray(value)) throw new Error(`${context} must be an array`)

  return value.map((candidate, index) => {
    const path = `${context}[${index}]`
    const row = recordAt(candidate, path)
    const slug = requiredString(row, 'slug', path)
    const date = requiredString(row, 'date', path)
    const bodyHtml = optionalNullableString(row, 'bodyHtml', path)
    const bodyPath = optionalNullableString(row, 'bodyPath', path)
    const readmeRawUrl = optionalNullableString(row, 'readmeRawUrl', path)
    const releasesUrl = optionalNullableString(row, 'releasesUrl', path)
    const seoTitle = optionalNullableString(row, 'seoTitle', path)

    if (!SLUG_RE.test(slug)) throw new Error(`${path}.slug contains unsupported characters`)
    if (!DATE_RE.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
      throw new Error(`${path}.date must be a valid YYYY-MM-DD date`)
    }
    if (bodyPath != null && !ARTICLE_BODY_PATH_RE.test(bodyPath)) {
      throw new Error(`${path}.bodyPath must reference an article-bodies HTML file`)
    }
    if ('topic' in row && !isArticleTopicSlug(row.topic)) {
      throw new Error(`${path}.topic must be a known topic slug`)
    }
    if ('noindex' in row && typeof row.noindex !== 'boolean') {
      throw new Error(`${path}.noindex must be a boolean`)
    }
    if ('pinned' in row && typeof row.pinned !== 'boolean') {
      throw new Error(`${path}.pinned must be a boolean`)
    }
    const pinnedTitle = optionalNullableString(row, 'pinnedTitle', path)
    if (pinnedTitle != null && (!pinnedTitle.trim() || pinnedTitle.trim().length > PINNED_TITLE_MAX)) {
      throw new Error(`${path}.pinnedTitle must be non-blank and at most ${PINNED_TITLE_MAX} characters`)
    }
    if (seoTitle != null && !seoTitle.trim()) {
      throw new Error(`${path}.seoTitle must not be blank`)
    }
    const series = row.series == null ? undefined : parseSeries(row.series, `${path}.series`)
    const video = row.video == null ? undefined : parseVideo(row.video, `${path}.video`)

    return {
      slug,
      title: requiredString(row, 'title', path),
      date,
      summary: nullableString(row, 'summary', path),
      ...(bodyHtml !== undefined ? { bodyHtml } : {}),
      imageUrl: nullableString(row, 'imageUrl', path),
      articleHeroUrl: nullableString(row, 'articleHeroUrl', path),
      githubEmbed: nullableString(row, 'githubEmbed', path),
      demoUrl: nullableString(row, 'demoUrl', path),
      repoUrl: nullableString(row, 'repoUrl', path),
      youtubeId: nullableString(row, 'youtubeId', path),
      otherEmbed: nullableString(row, 'otherEmbed', path),
      extraLinks: parseExtraLinks(row.extraLinks, `${path}.extraLinks`),
      ...(readmeRawUrl !== undefined ? { readmeRawUrl } : {}),
      ...(releasesUrl !== undefined ? { releasesUrl } : {}),
      ...(bodyPath !== undefined ? { bodyPath } : {}),
      ...(isArticleTopicSlug(row.topic) ? { topic: row.topic } : {}),
      ...(seoTitle ? { seoTitle: seoTitle.trim() } : {}),
      ...(row.noindex === true ? { noindex: true } : {}),
      ...(series ? { series } : {}),
      ...(video ? { video } : {}),
      ...(row.pinned === true ? { pinned: true } : {}),
      ...(pinnedTitle ? { pinnedTitle: pinnedTitle.trim() } : {}),
    }
  })
}
