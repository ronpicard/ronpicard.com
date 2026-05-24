import {
  sanitizeArticleHtmlRaw,
} from '../../shared/articleHtmlSanitize'
import { getViteBasePath, resolveResourcePathsInHtml } from './assetUrl'

/** Allowed <img src> after base URL rewrite: only mirrored assets under /resources/. */
function resourceImgSrcPattern(): RegExp {
  const base = getViteBasePath()
  const seg = base.replace(/^\//, '')
  if (seg) {
    return new RegExp(
      `^\\/${seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\/resources\\/[^\\s"']+$`,
      'i',
    )
  }
  return /^\/resources\/[^\s"']+$/i
}

/**
 * Sanitize stored article HTML at render time (mirrors ingest rules in `shared/articleHtmlSanitize.mjs`).
 */
export function prepareArticleBodyHtml(html: string | null | undefined): string | null {
  const resolved = resolveResourcePathsInHtml(html)
  if (!resolved?.trim()) return null
  return sanitizeArticleHtmlRaw(resolved, { resourceImgPattern: resourceImgSrcPattern() })
}
