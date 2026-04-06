#!/usr/bin/env node
/**
 * Fetches https://www.ronpicard.com/sitemap.xml and each blog post once,
 * writes src/data/siteArticles.json (run manually when the site grows).
 *
 * `articleHeroUrl`: first image block before any embed (Squarespace banner). Omitted on posts
 * that lead with a GitHub/demo iframe. Strips that image from `bodyHtml` so it is not duplicated.
 */
import * as cheerio from 'cheerio'
import { writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import DOMPurify from 'isomorphic-dompurify'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '../src/data/siteArticles.json')

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'ronpicard.com-mirror/1.0' } })
  if (!res.ok) throw new Error(`${url} ${res.status}`)
  return res.text()
}

function metaContent(html, prop) {
  const m = html.match(
    new RegExp(`<meta[^>]+(?:property|name)="${prop}"[^>]+content="([^"]*)"`, 'i'),
  )
  return m?.[1]?.trim() || null
}

function itempropDate(html) {
  const m = html.match(/<meta[^>]+itemprop="datePublished"[^>]+content="([^"]+)"/i)
  if (!m) return null
  const d = new Date(m[1])
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString().slice(0, 10)
}

function ogTitle(html) {
  const og = metaContent(html, 'og:title')
  if (og) return og.replace(/\s*[—–]\s*Home\s*$/i, '').trim()
  const t = html.match(/<title>([^<]+)<\/title>/i)
  return t?.[1]?.replace(/\s*[—–]\s*Home\s*$/i, '').trim() || 'Untitled'
}

function description(html) {
  return (
    metaContent(html, 'description') ||
    metaContent(html, 'og:description') ||
    html.match(/<meta[^>]+itemprop="description"[^>]+content="([^"]*)"/i)?.[1]?.trim() ||
    null
  )
}

function normalizeBtnHref(href) {
  let h = href.replace(/&amp;/g, '&').trim()
  if (h.startsWith('//')) h = 'https:' + h
  if (h.startsWith('/')) h = 'https://www.ronpicard.com' + h
  return h
}

/** Demo / Code buttons only inside post body (excludes header/footer). */
function extractContentButtons($) {
  const out = []
  const root = $('.blog-item-content.e-content').first()
  root.find('a[class*="sqs-block-button-element"]').each((_, el) => {
    const $a = $(el)
    const href = $a.attr('href')
    if (!href) return
    const label = $a.text().replace(/\s+/g, ' ').trim()
    out.push({ label: label || 'Link', href: normalizeBtnHref(href) })
  })
  return out
}

function normalizeRepoUrl(href) {
  try {
    const u = new URL(href)
    const segs = u.pathname.split('/').filter(Boolean)
    if (segs.length >= 2) return `${u.origin}/${segs[0]}/${segs[1]}`
    return href
  } catch {
    return href
  }
}

function pickDemoUrl(buttons) {
  const hit = buttons.find((b) => /\bdemo\b/i.test(b.label))
  return hit?.href ?? null
}

function pickRepoUrl(buttons) {
  const hit = buttons.find((b) => /\bcode\b/i.test(b.label))
  if (hit && /github\.com\/ronpicard\//i.test(hit.href) && !/gist\./i.test(hit.href)) {
    return normalizeRepoUrl(hit.href)
  }
  return null
}

function youtubeIdFromHtml(html) {
  const m =
    html.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/) ||
    html.match(/youtube-nocookie\.com\/embed\/([a-zA-Z0-9_-]{11})/)
  return m?.[1] || null
}

function normalizeHttps(url) {
  if (!url) return null
  let u = url.replace(/&amp;/g, '&').trim()
  if (u.startsWith('//')) u = 'https:' + u
  if (u.startsWith('http://')) u = 'https://' + u.slice(7)
  return u
}

function extractOgImage(html) {
  const raw =
    metaContent(html, 'og:image') ||
    metaContent(html, 'twitter:image') ||
    html.match(/<link[^>]+rel="image_src"[^>]+href="([^"]+)"/i)?.[1] ||
    html.match(/<meta[^>]+itemprop="image"[^>]+content="([^"]+)"/i)?.[1] ||
    null
  return normalizeHttps(raw)
}

function stripDuplicateBlocks($, root) {
  root
    .find(
      '.sqs-block.embed-block, .sqs-block.video-block, .sqs-block.button-block, .sqs-block-code, .sqs-block-html + .sqs-block.embed-block',
    )
    .remove()
  root.find('.sqs-block.website-component-block.button-block').remove()
  root.find('[data-sqsp-block="button"]').closest('.sqs-block').remove()
  root.find('[data-sqsp-block="embed"]').closest('.sqs-block').remove()
}

function isImageSqsBlock($el) {
  const t = $el.attr('data-block-type')
  return (
    $el.hasClass('image-block') ||
    $el.hasClass('sqs-block-image') ||
    t === '5'
  )
}

/** Embed / demo iframe blocks: if one appears before any image, the live site has no banner image. */
function isEmbedLikeSqsBlock($el) {
  const t = $el.attr('data-block-type')
  return (
    $el.hasClass('embed-block') ||
    $el.hasClass('sqs-block-embed') ||
    t === '22' ||
    $el.find('iframe[data-embed="true"]').length > 0 ||
    $el.find('> .sqs-block-content iframe').length > 0
  )
}

/**
 * First image block in reading order before any embed-like block (matches ronpicard.com banners:
 * Formal Methods has HTML then diagram image; Slime Soccer leads with GitHub embed → no banner).
 */
function findHeroImageBlock($, root) {
  const blocks = root.find('.sqs-block')
  for (let i = 0; i < blocks.length; i++) {
    const b = blocks.eq(i)
    if (isEmbedLikeSqsBlock(b)) return null
    if (isImageSqsBlock(b)) return b
  }
  return null
}

function extractLeadingArticleHeroUrl($) {
  const root = $('.blog-item-content.e-content').first()
  if (!root.length) return null
  const block = findHeroImageBlock($, root)
  if (!block?.length) return null
  const img = block.find('img').first()
  if (!img.length) return null
  const raw = img.attr('data-src') || img.attr('src')
  return raw ? normalizeHttps(raw) : null
}

function removeHeroImageBlockFromRoot($, root) {
  const block = findHeroImageBlock($, root)
  if (block?.length) block.remove()
}

function extractBlogBodyHtml($) {
  const root = $('.blog-item-content.e-content').first().clone()
  if (!root.length) return null
  removeHeroImageBlockFromRoot($, root)
  stripDuplicateBlocks($, root)
  root.find('script, style, iframe, object, embed, form, input, button').remove()
  const raw = root.html()
  if (!raw?.trim()) return null
  let safe = DOMPurify.sanitize(raw, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'a',
      'strong',
      'b',
      'em',
      'i',
      'blockquote',
      'pre',
      'code',
      'img',
      'hr',
      'div',
      'span',
      'figure',
      'figcaption',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'colspan', 'rowspan'],
    ALLOW_DATA_ATTR: false,
  })
  safe = safe.replace(/<a(\s+[^>]*?)>/gi, (full, inner) => {
    if (/target\s*=/i.test(inner)) return full
    if (!/href\s*=\s*["']https?:/i.test(inner)) return full
    return `<a${inner} target="_blank" rel="noopener noreferrer">`
  })
  const trimmed = safe.trim()
  if (!trimmed) return null
  const $chk = cheerio.load(trimmed)
  const text = $chk.text().replace(/\s+/g, ' ').trim()
  if (text.length < 30) return null
  return trimmed
}

function normalizeHrefKey(href) {
  if (!href) return ''
  try {
    const u = new URL(href)
    u.hash = ''
    let p = u.pathname.replace(/\/$/, '') || '/'
    return `${u.origin}${p}`.toLowerCase()
  } catch {
    return href.replace(/\/$/, '').toLowerCase()
  }
}

export function parsePost(url, html) {
  const slug = url.replace(/^https:\/\/www\.ronpicard\.com\/blog\//, '').replace(/\/$/, '')
  const title = ogTitle(html)
  const date = itempropDate(html) || '1970-01-01'
  let summary = description(html)
  const imageUrl = extractOgImage(html)

  const $ = cheerio.load(html)
  const articleHeroUrl = extractLeadingArticleHeroUrl($)
  const buttons = extractContentButtons($)
  const bodyHtml = extractBlogBodyHtml($)

  const iframes = [...html.matchAll(/iframe[^>]+src="([^"]+)"/gi)].map((x) =>
    x[1].replace(/&amp;/g, '&'),
  )
  const githubEmbed =
    iframes.find((u) => /ronpicard\.github\.io/i.test(u))?.split('?')[0] || null
  const youtubeId = youtubeIdFromHtml(html)
  const otherEmbed =
    iframes.find(
      (u) =>
        !/ronpicard\.github\.io/i.test(u) &&
        !/youtube\.com\/embed/i.test(u) &&
        !/youtube-nocookie\.com\/embed/i.test(u),
    ) || null

  const demoUrl = pickDemoUrl(buttons)
  const repoUrl = pickRepoUrl(buttons)

  const dk = normalizeHrefKey(demoUrl)
  const rk = normalizeHrefKey(repoUrl)

  const extraLinks = buttons.filter((b) => {
    const k = normalizeHrefKey(b.href)
    if (dk && k === dk) return false
    if (rk && k === rk) return false
    if (/ronpicard\.com\/\?author=/i.test(b.href)) return false
    if (b.label.toLowerCase() === 'ron picard') return false
    return true
  })

  if (!summary && !bodyHtml) {
    const jsonLd = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i)
    if (jsonLd) {
      try {
        const j = JSON.parse(jsonLd[1])
        const node = Array.isArray(j) ? j[0] : j
        summary = node?.description || node?.headline || null
      } catch {
        /* ignore */
      }
    }
  }

  return {
    slug,
    title,
    date,
    summary,
    bodyHtml,
    imageUrl,
    articleHeroUrl,
    githubEmbed,
    demoUrl,
    repoUrl,
    youtubeId,
    otherEmbed,
    extraLinks,
  }
}

async function main() {
  const xml = await fetchText('https://www.ronpicard.com/sitemap.xml')
  const urls = [...xml.matchAll(/<loc>(https:\/\/www\.ronpicard\.com\/blog\/[^<]+)<\/loc>/g)]
    .map((m) => m[1].replace(/\/$/, ''))
    .filter((u) => !u.endsWith('/blog'))

  console.error('posts:', urls.length)
  const rows = []
  for (let i = 0; i < urls.length; i++) {
    const u = urls[i]
    process.stderr.write(`\r${i + 1}/${urls.length} ${u.slice(-40)}   `)
    try {
      const html = await fetchText(u)
      rows.push(parsePost(u, html))
    } catch (e) {
      console.error(`\nfail ${u}`, e.message)
    }
    await sleep(120)
  }
  process.stderr.write('\n')
  writeFileSync(OUT, JSON.stringify(rows, null, 2))
  console.error('wrote', OUT)
}

const isMainModule = resolve(process.argv[1] || '') === fileURLToPath(import.meta.url)
if (isMainModule) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
