#!/usr/bin/env node
/**
 * Downloads static assets from siteArticles.json (hero images, <img> and PDF/ZIP
 * in bodyHtml) into public/resources/, rewrites JSON to resources/<hash>.ext.
 * Run after sync:articles. Skips YouTube, github.io, etc.
 */
import * as cheerio from 'cheerio'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, extname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const ARTICLES_JSON = join(ROOT, 'src/data/siteArticles.json')
const OUT_DIR = join(ROOT, 'public/resources')
const MANIFEST_JSON = join(__dirname, 'resource-manifest.json')

const UA = 'ronpicard.com-mirror-resources/1.0'
const REFERER = 'https://www.ronpicard.com/'

const EXCLUDE_HOST = [
  /(^|\.)youtube\.com$/i,
  /(^|\.)youtube-nocookie\.com$/i,
  /^youtu\.be$/i,
  /(^|\.)github\.io$/i,
  /(^|\.)googlevideo\.com$/i,
]

const EXT_RE = /\.(png|jpe?g|gif|webp|svg|avif|ico|bmp|pdf|zip)$/i

function extFromMime(ct) {
  if (!ct) return ''
  const m = ct.split(';')[0].trim().toLowerCase()
  const map = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'image/avif': '.avif',
    'image/x-icon': '.ico',
    'image/bmp': '.bmp',
    'application/pdf': '.pdf',
    'application/zip': '.zip',
  }
  return map[m] || ''
}

function shouldMirrorAbsoluteUrl(href) {
  if (!href || typeof href !== 'string') return false
  let u
  try {
    u = new URL(href.trim())
  } catch {
    return false
  }
  if (u.protocol !== 'https:') return false
  if (EXCLUDE_HOST.some((re) => re.test(u.hostname))) return false
  const pathOnly = u.pathname.split('/').pop() || ''
  return EXT_RE.test(pathOnly)
}

function absolutize(href, postBase) {
  if (!href || !href.trim()) return null
  const h = href.trim()
  if (h.startsWith('mailto:') || h.startsWith('#')) return null
  try {
    return new URL(h, postBase).href
  } catch {
    return null
  }
}

function hashName(url, ext) {
  const h = createHash('sha256').update(url).digest('hex').slice(0, 14)
  const e = ext && ext.startsWith('.') ? ext : ext ? `.${ext}` : ''
  return `${h}${e}`
}

function loadManifest() {
  if (!existsSync(MANIFEST_JSON)) return {}
  try {
    return JSON.parse(readFileSync(MANIFEST_JSON, 'utf8'))
  } catch {
    return {}
  }
}

function saveManifest(m) {
  writeFileSync(MANIFEST_JSON, JSON.stringify(m, null, 2))
}

function collectUrls(rows) {
  const set = new Set()
  for (const row of rows) {
    const postBase = `https://www.ronpicard.com/blog/${row.slug}/`
    if (row.imageUrl && shouldMirrorAbsoluteUrl(row.imageUrl)) {
      set.add(row.imageUrl.trim())
    }
    if (row.bodyHtml) {
      const $ = cheerio.load(row.bodyHtml, null, false)
      $('img[src]').each((_, el) => {
        const s = $(el).attr('src')
        const abs = absolutize(s, postBase)
        if (abs && shouldMirrorAbsoluteUrl(abs)) set.add(abs)
      })
      $('a[href]').each((_, el) => {
        const h = $(el).attr('href')
        if (!h) return
        const path = h.split('?')[0] || ''
        if (!EXT_RE.test(path)) return
        const abs = absolutize(h, postBase)
        if (abs && shouldMirrorAbsoluteUrl(abs)) set.add(abs)
      })
    }
  }
  return [...set]
}

async function fetchAsset(url) {
  const res = await fetch(url, {
    headers: {
      'user-agent': UA,
      referer: REFERER,
      accept: '*/*',
    },
    redirect: 'follow',
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  const buf = Buffer.from(await res.arrayBuffer())
  const ct = res.headers.get('content-type') || ''
  let ext = extname(new URL(url).pathname).toLowerCase()
  if (!ext) {
    ext = extFromMime(ct) || '.bin'
  }
  if (ext === '.jpeg') ext = '.jpg'
  const mimeOk =
    /^image\//i.test(ct) ||
    ct.includes('application/pdf') ||
    ct.includes('application/zip') ||
    ct.includes('application/octet-stream')
  if (!mimeOk && buf.length > 0) {
    const isPdf = buf.slice(0, 4).toString() === '%PDF'
    const isPng = buf[0] === 0x89 && buf[1] === 0x50
    const isJpg = buf[0] === 0xff && buf[1] === 0xd8
    const isGif = buf.slice(0, 3).toString() === 'GIF'
    const isWebp = buf.slice(8, 12).toString() === 'WEBP'
    if (!(isPdf || isPng || isJpg || isGif || isWebp)) {
      throw new Error(`unexpected content-type: ${ct || '(none)'}`)
    }
  }
  return { buf, ext }
}

async function downloadWithConcurrency(urls, concurrency, fn) {
  const results = new Map()
  let i = 0
  async function worker() {
    while (true) {
      const j = i++
      if (j >= urls.length) return
      const url = urls[j]
      try {
        results.set(url, await fn(url))
      } catch (e) {
        results.set(url, { error: e })
      }
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, urls.length) }, () => worker())
  await Promise.all(workers)
  return results
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })
  const rows = JSON.parse(readFileSync(ARTICLES_JSON, 'utf8'))
  const wanted = collectUrls(rows)
  const manifest = loadManifest()
  const urlToLocal = new Map()

  for (const url of wanted) {
    if (manifest[url]?.path && existsSync(join(ROOT, 'public', manifest[url].path))) {
      urlToLocal.set(url, manifest[url].path)
    }
  }

  const missing = wanted.filter((u) => !urlToLocal.has(u))
  console.log(`mirror-resources: ${wanted.length} unique asset URLs, ${missing.length} to fetch`)

  if (missing.length > 0) {
    const fetched = await downloadWithConcurrency(missing, 6, async (url) => {
      process.stderr.write(`  fetch ${url.slice(0, 88)}…\n`)
      const { buf, ext } = await fetchAsset(url)
      const name = hashName(url, ext)
      const rel = `resources/${name}`
      writeFileSync(join(OUT_DIR, name), buf)
      manifest[url] = { path: rel, bytes: buf.length }
      return rel
    })

    for (const url of missing) {
      const r = fetched.get(url)
      if (r?.error) {
        console.warn(`  skip (failed): ${url}\n    ${r.error.message}`)
        continue
      }
      if (typeof r === 'string') urlToLocal.set(url, r)
    }
    saveManifest(manifest)
  }

  const updated = rows.map((row) => {
    const postBase = `https://www.ronpicard.com/blog/${row.slug}/`
    let imageUrl = row.imageUrl
    if (imageUrl && urlToLocal.has(imageUrl.trim())) {
      imageUrl = urlToLocal.get(imageUrl.trim())
    }
    let bodyHtml = row.bodyHtml
    if (bodyHtml) {
      const $ = cheerio.load(bodyHtml, null, false)
      $('img[src]').each((_, el) => {
        const s = $(el).attr('src')
        const abs = absolutize(s, postBase)
        if (abs && urlToLocal.has(abs)) {
          $(el).attr('src', urlToLocal.get(abs))
        }
      })
      $('a[href]').each((_, el) => {
        const h = $(el).attr('href')
        const abs = h ? absolutize(h, postBase) : null
        if (abs && urlToLocal.has(abs)) {
          $(el).attr('href', urlToLocal.get(abs))
        }
      })
      bodyHtml = $.html()
    }
    return { ...row, imageUrl, bodyHtml }
  })

  writeFileSync(ARTICLES_JSON, JSON.stringify(updated, null, 2))
  console.log('mirror-resources: wrote', ARTICLES_JSON)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
