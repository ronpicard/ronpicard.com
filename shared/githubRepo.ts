type GithubRepoPath = { owner: string; repo: string }
type ParsedGithubRepoUrl = GithubRepoPath & { url: string }
const GITHUB_REPO_SEGMENT_RE = /^[a-zA-Z0-9._-]+$/

/** Validates and parses `https://github.com/owner/repo/...` (www host allowed). */
export function parseGithubRepoUrl(
  href: string | null | undefined,
): ParsedGithubRepoUrl | null {
  if (!href?.trim()) return null
  try {
    const u = new URL(href.trim())
    const h = u.hostname.toLowerCase()
    if (u.protocol !== 'https:') return null
    if (h !== 'github.com' && h !== 'www.github.com') return null
    if (u.username || u.password || u.search || u.hash) return null
    const parts = u.pathname.split('/').filter(Boolean)
    if (parts.length < 2) return null
    if (!GITHUB_REPO_SEGMENT_RE.test(parts[0]!) || !GITHUB_REPO_SEGMENT_RE.test(parts[1]!)) {
      return null
    }
    return { owner: parts[0]!, repo: parts[1]!, url: u.toString() }
  } catch {
    return null
  }
}

export function parseGithubRepoPath(href: string | null | undefined): GithubRepoPath | null {
  const parsed = parseGithubRepoUrl(href)
  return parsed ? { owner: parsed.owner, repo: parsed.repo } : null
}

/** `owner/repo` lowercase for comparing repo links. */
export function githubRepoPairKey(href: string | null | undefined): string | null {
  const p = parseGithubRepoUrl(href)
  return p ? `${p.owner}/${p.repo}`.toLowerCase() : null
}

/** Canonical repo root URL used when ingesting Squarespace Code buttons. */
export function normalizeGithubRepoUrl(href: string): string {
  const p = parseGithubRepoUrl(href)
  if (!p) return href
  return `https://github.com/${p.owner}/${p.repo}`
}
