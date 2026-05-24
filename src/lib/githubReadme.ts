import { marked } from 'marked'
import { README_MAX_BYTES } from '../config/security'
import {
  githubBlobDirectoryBaseFromRawUrl,
  githubBlobViewerUrlFromRawUrl,
} from '../../shared/githubRawContentUrls'
import { prepareArticleBodyHtml } from './sanitizeArticleHtml'

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
  if (markdown.length > README_MAX_BYTES) return null
  const blobDir = githubBlobDirectoryBaseFromRawUrl(rawReadmeUrl)
  if (!blobDir) return null

  marked.setOptions({ gfm: true })
  let html = marked.parse(markdown, { async: false }) as string
  html = html.replace(/^\s*<h1[^>]*>[\s\S]*?<\/h1>\s*/i, '')
  html = absolutizeRelativeLinks(html, blobDir)

  const intro = `<p class="">README below is loaded dynamically from <a href="${githubBlobViewerUrlFromRawUrl(rawReadmeUrl) ?? rawReadmeUrl}">GitHub</a> each time you open this page (you may see a short delay while it fetches).</p>\n\n`
  return prepareArticleBodyHtml(intro + html)
}
