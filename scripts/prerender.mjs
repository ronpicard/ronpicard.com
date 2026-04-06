import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const DIST_DIR = path.resolve(process.cwd(), 'dist')
const SITE_CANONICAL_ROOT = 'https://ronpicard.com'

function decodeHtml(raw) {
  return String(raw || '')
    .replace(/&mdash;/gi, '—')
    .replace(/&ndash;/gi, '–')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s*[—–]\s*Home\s*$/i, '')
    .trim()
}

function slugifyTitleForRoute(title) {
  let s = decodeHtml(title)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
  s = s.replace(/[—–]/g, '-')
  s = s.replace(/[^a-z0-9]+/g, '-')
  s = s.replace(/^-+|-+$/g, '').replace(/-+/g, '-')
  if (s.length > 96) {
    s = s.slice(0, 96).replace(/-[^-]+$/, '')
  }
  return s || 'post'
}

function uniqueSlugsFromTitles(titles) {
  const counts = new Map()
  return titles.map((t) => {
    const base = slugifyTitleForRoute(t)
    const n = (counts.get(base) ?? 0) + 1
    counts.set(base, n)
    return n === 1 ? base : `${base}-${n}`
  })
}

function stripTags(s) {
  return String(s || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function truncate(text, max = 158) {
  const t = String(text || '').replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1).trim()}…`
}

function absoluteAssetUrl(rel) {
  if (!rel || !String(rel).trim()) return null
  const p = String(rel).replace(/^\/+/, '')
  if (/^https?:\/\//i.test(p)) return p
  return `${SITE_CANONICAL_ROOT}/${p}`
}

function canonicalUrl(route) {
  const p = route.startsWith('/') ? route : `/${route}`
  return `${SITE_CANONICAL_ROOT}${p}`
}

function isDataStructuresVisualizerRow(row) {
  const s = `${row.githubEmbed || ''}${row.demoUrl || ''}`
  return s.includes('data-structures-visualizer-web-app')
}

function stripExistingSeoHead(html) {
  return html
    .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
    .replace(/<meta\s+name="description"[\s\S]*?>\s*/gi, '')
    .replace(/<link\s+rel="canonical"[\s\S]*?>\s*/gi, '')
    .replace(/<meta\s+property="og:[\s\S]*?>\s*/gi, '')
    .replace(/<meta\s+name="twitter:[\s\S]*?>\s*/gi, '')
}

function injectSeoHead(html, { title, description, url, imageAbs, ogType }) {
  const twitterCard = imageAbs ? 'summary_large_image' : 'summary'
  const tags = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeAttr(description)}" />`,
    `<meta name="robots" content="index, follow" />`,
    `<meta name="author" content="Ron Picard" />`,
    `<link rel="canonical" href="${escapeAttr(url)}" />`,
    `<meta property="og:title" content="${escapeAttr(title)}" />`,
    `<meta property="og:description" content="${escapeAttr(description)}" />`,
    `<meta property="og:url" content="${escapeAttr(url)}" />`,
    `<meta property="og:type" content="${escapeAttr(ogType)}" />`,
    `<meta property="og:site_name" content="Ron Picard" />`,
    `<meta property="og:locale" content="en_US" />`,
    imageAbs ? `<meta property="og:image" content="${escapeAttr(imageAbs)}" />` : '',
    imageAbs ? `<meta property="og:image:secure_url" content="${escapeAttr(imageAbs)}" />` : '',
    `<meta name="twitter:card" content="${escapeAttr(twitterCard)}" />`,
    `<meta name="twitter:title" content="${escapeAttr(title)}" />`,
    `<meta name="twitter:description" content="${escapeAttr(description)}" />`,
    imageAbs ? `<meta name="twitter:image" content="${escapeAttr(imageAbs)}" />` : '',
  ]
    .filter(Boolean)
    .join('\n')

  const cleaned = stripExistingSeoHead(html)
  return cleaned.replace(/<\/head>/i, `${tags}\n</head>`)
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeAttr(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

async function writeOut(relPath, html) {
  const outFile = path.join(DIST_DIR, relPath)
  await mkdir(path.dirname(outFile), { recursive: true })
  await writeFile(outFile, html, 'utf8')
}

async function main() {
  const template = await readFile(path.join(DIST_DIR, 'index.html'), 'utf8')
  const rows = JSON.parse(await readFile(path.resolve('src/data/siteArticles.json'), 'utf8'))

  // Home (default)
  const home = injectSeoHead(template, {
    title: 'Ron Picard — My project involving AI, Software, Aviation, and more',
    description:
      'Ron Picard — My project involving AI, Software, Aviation, and more: portfolio, web apps, software lessons, research, and engineering work.',
    url: canonicalUrl('/'),
    imageAbs: absoluteAssetUrl('resources/82f3c8eae802c3.jpg'),
    ogType: 'website',
  })
  await writeOut('index.html', home)

  // Blog pages
  const indexed = rows.map((row, sourceIndex) => ({ row, sourceIndex }))
  const sorted = indexed
    .sort((a, b) => {
      const byDate = String(b.row.date).localeCompare(String(a.row.date))
      if (byDate !== 0) return byDate
      if (a.row.date === '2026-03-22' && b.row.date === '2026-03-22') {
        const aData = isDataStructuresVisualizerRow(a.row)
        const bData = isDataStructuresVisualizerRow(b.row)
        if (aData !== bData) return aData ? 1 : -1
      }
      return b.sourceIndex - a.sourceIndex
    })
    .map((x) => x.row)
  const decodedTitles = sorted.map((r) => decodeHtml(r.title))
  const routeSlugs = uniqueSlugsFromTitles(decodedTitles)
  const titlesForLegacySlug = decodedTitles.map((t, i) => {
    const row = sorted[i]
    return row.date >= '2026-03-22' && row.githubEmbed ? `${t.trim()} Web App` : t
  })
  const legacyRouteSlugs = uniqueSlugsFromTitles(titlesForLegacySlug)

  for (let i = 0; i < sorted.length; i++) {
    const row = sorted[i]
    const slug = routeSlugs[i]
    const title = decodedTitles[i]
    const summary = truncate(stripTags(row.summary || ''), 158) || title
    const ogImage = row.articleHeroUrl || row.imageUrl || null
    const imageAbs = absoluteAssetUrl(ogImage)
    const route = `/blog/${slug}`

    const html = injectSeoHead(template, {
      title: `${title} | Ron Picard`,
      description: summary,
      url: canonicalUrl(route),
      imageAbs,
      ogType: 'article',
    })

    await writeOut(path.join('blog', slug, 'index.html'), html)

    const leg = legacyRouteSlugs[i]
    if (leg !== slug) {
      await writeOut(path.join('blog', leg, 'index.html'), html)
    }
  }

  // GitHub Pages SPA fallback for non-prerendered routes.
  await writeOut('404.html', home)
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})

