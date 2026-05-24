type GithubRepoPath = { owner: string; repo: string }

/** Parses `https://github.com/owner/repo/...` (www host allowed). */
function parseGithubRepoPath(href: string | null | undefined): GithubRepoPath | null {
  if (!href?.trim()) return null
  try {
    const u = new URL(href.trim())
    const h = u.hostname.toLowerCase()
    if (h !== 'github.com' && h !== 'www.github.com') return null
    const parts = u.pathname.split('/').filter(Boolean)
    if (parts.length < 2) return null
    return { owner: parts[0]!, repo: parts[1]! }
  } catch {
    return null
  }
}

/** `owner/repo` lowercase for comparing repo links. */
export function githubRepoPairKey(href: string | null | undefined): string | null {
  const p = parseGithubRepoPath(href)
  return p ? `${p.owner}/${p.repo}`.toLowerCase() : null
}

/** Canonical repo root URL used when ingesting Squarespace Code buttons. */
export function normalizeGithubRepoUrl(href: string): string {
  const p = parseGithubRepoPath(href)
  if (!p) return href
  return `https://github.com/${p.owner}/${p.repo}`
}
