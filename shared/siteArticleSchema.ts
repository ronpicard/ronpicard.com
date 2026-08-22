export type SiteArticleLink = {
  label: string
  href: string
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
  extraLinks: SiteArticleLink[]
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
    return {
      label: requiredString(link, 'label', linkPath),
      href: requiredString(link, 'href', linkPath),
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

    if (!SLUG_RE.test(slug)) throw new Error(`${path}.slug contains unsupported characters`)
    if (!DATE_RE.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
      throw new Error(`${path}.date must be a valid YYYY-MM-DD date`)
    }
    if (bodyPath != null && !ARTICLE_BODY_PATH_RE.test(bodyPath)) {
      throw new Error(`${path}.bodyPath must reference an article-bodies HTML file`)
    }

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
      ...(bodyPath !== undefined ? { bodyPath } : {}),
    }
  })
}
