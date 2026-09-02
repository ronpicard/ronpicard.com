/**
 * Validates URLs used for navigation and embeds so tampered JSON cannot
 * inject javascript:, data:, or unexpected hosts into the DOM.
 */
import { parseRawGithubContentUrl } from '../../shared/githubRawContentUrls'
import { parseGithubRepoUrl } from '../../shared/githubRepo'
import { UNSAFE_HREF_SCHEME_RE } from '../../shared/urlSchemes'
import { isSafeLocalAssetPath } from './assetUrl'

const YOUTUBE_ID = /^[a-zA-Z0-9_-]{6,32}$/

function isProduction(): boolean {
  return import.meta.env.PROD
}

export function safeYoutubeId(raw: string | null | undefined): string | null {
  const id = raw?.trim()
  if (!id || !YOUTUBE_ID.test(id)) return null
  return id
}

const ALLOWED_GITHUB_PAGES_HOST = 'ronpicard.github.io'

export function safeGithubPagesUrl(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null
  let u: URL
  try {
    u = new URL(raw.trim())
  } catch {
    return null
  }
  if (u.protocol !== 'https:') return null
  if (u.hostname.toLowerCase() !== ALLOWED_GITHUB_PAGES_HOST) return null
  if (u.username || u.password) return null
  return u.toString()
}

/**
 * Raw markdown on GitHub (browser fetch + CORS). Path must include branch and file, e.g.
 * …/owner/repo/main/README.md
 */
export function safeGithubReadmeRawUrl(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null
  return parseRawGithubContentUrl(raw.trim())?.rawUrl ?? null
}

export function safeGithubRepoUrl(raw: string | null | undefined): string | null {
  return parseGithubRepoUrl(raw)?.url ?? null
}

/**
 * GitHub releases page for a repo: `https://github.com/owner/repo/releases[/latest|/tag/<tag>]`.
 * Same host/scheme/credential rules as repo URLs, plus the path must stay under `releases`.
 */
export function safeGithubReleasesUrl(raw: string | null | undefined): string | null {
  const parsed = parseGithubRepoUrl(raw)
  if (!parsed) return null
  const parts = new URL(parsed.url).pathname.split('/').filter(Boolean)
  if (parts[2] !== 'releases') return null
  if (parts.some((p) => p === '.' || p === '..')) return null
  return parsed.url
}

/** Demo URLs: GitHub Pages (same rules as embed). */
export function safeDemoUrl(raw: string | null | undefined): string | null {
  return safeGithubPagesUrl(raw)
}

/**
 * Optional third-party iframe (e.g. future embeds). Only https and no embedded credentials.
 */
const ALLOWED_EMBED_HOSTS = new Set([
  'www.youtube-nocookie.com',
  'youtube-nocookie.com',
  'ronpicard.github.io',
])

export function safeHttpsEmbedUrl(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null
  let u: URL
  try {
    u = new URL(raw.trim())
  } catch {
    return null
  }
  if (u.protocol !== 'https:') return null
  if (u.username || u.password) return null
  if (!ALLOWED_EMBED_HOSTS.has(u.hostname.toLowerCase())) return null
  return u.toString()
}

/**
 * Resolves asset-relative links and allows https navigation targets for extra link buttons.
 */
/** Any https/http URL for outbound links (articles, videos, etc.). */
export function safeHttpUrl(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null
  const t = raw.trim()
  if (UNSAFE_HREF_SCHEME_RE.test(t)) return null
  try {
    const u = new URL(t)
    if (isProduction() && u.protocol !== 'https:') return null
    if (!isProduction() && u.protocol !== 'https:' && u.protocol !== 'http:') return null
    if (u.username || u.password) return null
    return u.toString()
  } catch {
    return null
  }
}

export function safeArticleLinkHref(
  href: string,
  resolveAsset: (u: string) => string | null,
): string | null {
  const t = href.trim()
  if (!t) return null
  if (UNSAFE_HREF_SCHEME_RE.test(t)) return null
  if (/^https?:\/\//i.test(t)) {
    return safeHttpUrl(t)
  }
  if (!t.startsWith('resources/') || !isSafeLocalAssetPath(t)) return null
  const local = resolveAsset(t)
  return local ?? null
}
