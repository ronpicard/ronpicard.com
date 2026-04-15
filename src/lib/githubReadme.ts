import { marked } from 'marked'
import { prepareArticleBodyHtml } from './sanitizeArticleHtml'

/**
 * `https://raw.githubusercontent.com/owner/repo/branch/path/to/file.md`
 * → directory prefix for resolving relative links: `https://github.com/owner/repo/blob/branch/path/to/`
 */
export function githubBlobDirectoryBaseFromRawUrl(rawUrl: string): string | null {
  try {
    const u = new URL(rawUrl)
    if (u.protocol !== 'https:' || u.hostname.toLowerCase() !== 'raw.githubusercontent.com') return null
    const parts = u.pathname.split('/').filter(Boolean)
    if (parts.length < 4) return null
    const owner = parts[0]
    const repo = parts[1]
    const branch = parts[2]
    const fileParts = parts.slice(3)
    if (fileParts.length < 1) return null
    fileParts.pop()
    const sub = fileParts.length ? `${fileParts.map(encodeURIComponent).join('/')}/` : ''
    return `https://github.com/${owner}/${repo}/blob/${branch}/${sub}`
  } catch {
    return null
  }
}

/** Human-facing GitHub page for the same file as the raw URL. */
export function githubBlobViewerUrlFromRawUrl(rawUrl: string): string | null {
  try {
    const u = new URL(rawUrl)
    if (u.protocol !== 'https:' || u.hostname.toLowerCase() !== 'raw.githubusercontent.com') return null
    const parts = u.pathname.split('/').filter(Boolean)
    if (parts.length < 4) return null
    const [owner, repo, branch, ...rest] = parts
    const path = rest.map(encodeURIComponent).join('/')
    return `https://github.com/${owner}/${repo}/blob/${branch}/${path}`
  } catch {
    return null
  }
}

function absolutizeRelativeLinks(html: string, blobDirBase: string): string {
  const base = blobDirBase.endsWith('/') ? blobDirBase : `${blobDirBase}/`
  return html.replace(/<a\s+([^>]*?)href="([^"]*)"/gi, (full, before, href) => {
    const h = href.trim()
    if (/^https?:\/\//i.test(h) || h.startsWith('#') || h.startsWith('mailto:')) return full
    if (h.includes('..')) return full
    const rel = h.replace(/^\.\//, '')
    const path = rel
      .split('/')
      .filter(Boolean)
      .map((seg: string) => encodeURIComponent(seg))
      .join('/')
    return `<a ${before}href="${base}${path}"`
  })
}

export function markdownReadmeToSafeHtml(markdown: string, rawReadmeUrl: string): string | null {
  const blobDir = githubBlobDirectoryBaseFromRawUrl(rawReadmeUrl)
  if (!blobDir) return null

  marked.setOptions({ gfm: true })
  let html = marked.parse(markdown, { async: false }) as string
  html = html.replace(/^\s*<h1[^>]*>[\s\S]*?<\/h1>\s*/i, '')
  html = absolutizeRelativeLinks(html, blobDir)

  const intro = `<p class="">README below is loaded dynamically from <a href="${githubBlobViewerUrlFromRawUrl(rawReadmeUrl) ?? rawReadmeUrl}">GitHub</a> each time you open this page (you may see a short delay while it fetches).</p>\n\n`
  return prepareArticleBodyHtml(intro + html)
}
