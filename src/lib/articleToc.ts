/**
 * Table of contents and reading time for long article bodies. Runs on HTML
 * that has already been sanitized: the sanitizer strips every `id`, so the
 * only ids in the result are the `section-…` ones added here from heading text.
 */
export type TocEntry = { id: string; text: string }

export type ArticleOutline = {
  /** The body with an id on each `<h2>` listed in `toc`. */
  html: string
  toc: TocEntry[]
  words: number
  minutes: number
}

export const WORDS_PER_MINUTE = 230
/** A body needs at least this many sections and words before it gets a table of contents. */
export const TOC_MIN_HEADINGS = 4
export const TOC_MIN_WORDS = 1500

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === '#') {
      const n = code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10)
      return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : match
    }
    return ENTITIES[code.toLowerCase()] ?? match
  })
}

function plainText(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim()
}

function headingId(text: string, used: Set<string>): string {
  const base =
    'section-' +
    (text
      .normalize('NFKD')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60)
      .replace(/-+$/, '') || 'part')
  let id = base
  for (let n = 2; used.has(id); n++) id = `${base}-${n}`
  used.add(id)
  return id
}

export function outlineArticleHtml(html: string): ArticleOutline {
  const toc: TocEntry[] = []
  const used = new Set<string>()
  const withIds = html.replace(/<h2(\s[^>]*)?>([\s\S]*?)<\/h2>/gi, (match, attrs: string | undefined, inner: string) => {
    const text = plainText(inner)
    if (!text || /\sid\s*=/i.test(attrs ?? '')) return match
    const id = headingId(text, used)
    toc.push({ id, text })
    return `<h2${attrs ?? ''} id="${id}">${inner}</h2>`
  })
  const text = plainText(html)
  const words = text ? text.split(' ').length : 0
  return { html: withIds, toc, words, minutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)) }
}

export function showsTableOfContents(outline: ArticleOutline): boolean {
  return outline.toc.length >= TOC_MIN_HEADINGS && outline.words >= TOC_MIN_WORDS
}
