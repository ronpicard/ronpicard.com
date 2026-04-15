/**
 * Validates URLs used for navigation and embeds so tampered JSON cannot
 * inject javascript:, data:, or unexpected hosts into the DOM.
 */

const YOUTUBE_ID = /^[a-zA-Z0-9_-]{6,32}$/

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
  let u: URL
  try {
    u = new URL(raw.trim())
  } catch {
    return null
  }
  if (u.protocol !== 'https:') return null
  if (u.hostname.toLowerCase() !== 'raw.githubusercontent.com') return null
  if (u.username || u.password) return null
  const parts = u.pathname.split('/').filter(Boolean)
  if (parts.length < 4) return null
  return u.toString()
}

export function safeGithubRepoUrl(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null
  let u: URL
  try {
    u = new URL(raw.trim())
  } catch {
    return null
  }
  if (u.protocol !== 'https:') return null
  const h = u.hostname.toLowerCase()
  if (h !== 'github.com' && h !== 'www.github.com') return null
  if (u.username || u.password) return null
  return u.toString()
}

/** Demo URLs: GitHub Pages (same rules as embed). */
export function safeDemoUrl(raw: string | null | undefined): string | null {
  return safeGithubPagesUrl(raw)
}

/**
 * Optional third-party iframe (e.g. future embeds). Only https and no embedded credentials.
 */
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
  return u.toString()
}

/**
 * Resolves asset-relative links and allows https navigation targets for extra link buttons.
 */
/** Any https/http URL for outbound links (articles, videos, etc.). */
export function safeHttpUrl(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null
  try {
    const u = new URL(raw.trim())
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null
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
  if (/^https?:\/\//i.test(t)) {
    try {
      const u = new URL(t)
      if (u.protocol !== 'https:' && u.protocol !== 'http:') return null
      if (u.username || u.password) return null
      return u.toString()
    } catch {
      return null
    }
  }
  const local = resolveAsset(t)
  return local ?? null
}
