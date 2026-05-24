/**
 * Parse `https://raw.githubusercontent.com/owner/repo/branch/path/to/file` URLs.
 */

export function parseRawGithubContentUrl(rawUrl: string) {
  try {
    const u = new URL(rawUrl)
    if (u.protocol !== 'https:' || u.hostname.toLowerCase() !== 'raw.githubusercontent.com') return null
    const parts = u.pathname.split('/').filter(Boolean)
    if (parts.length < 4) return null
    const owner = parts[0]!
    const repo = parts[1]!
    const branch = parts[2]!
    const fileParts = parts.slice(3)
    if (fileParts.length < 1) return null
    const filePath = fileParts.map(encodeURIComponent).join('/')
    const dirParts = fileParts.slice(0, -1)
    const sub = dirParts.length ? `${dirParts.map(encodeURIComponent).join('/')}/` : ''
    const blobDirBase = `https://github.com/${owner}/${repo}/blob/${branch}/${sub}`
    const viewerUrl = `https://github.com/${owner}/${repo}/blob/${branch}/${filePath}`
    return { owner, repo, branch, blobDirBase, viewerUrl }
  } catch {
    return null
  }
}

export function githubBlobDirectoryBaseFromRawUrl(rawUrl: string): string | null {
  return parseRawGithubContentUrl(rawUrl)?.blobDirBase ?? null
}

export function githubBlobViewerUrlFromRawUrl(rawUrl: string): string | null {
  return parseRawGithubContentUrl(rawUrl)?.viewerUrl ?? null
}
