import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { escapeHtml, escapeHtmlAttr } from '../shared/htmlEscape.ts'
import { articleJsonLd, homeJsonLd } from '../shared/jsonLd.ts'
import { parseSiteArticleRows } from '../shared/siteArticleSchema.ts'
import { buildRobotsTxt, buildSitemapXml } from '../shared/sitemap.ts'
import {
  absoluteAssetUrl,
  canonicalUrl,
  DEFAULT_DESCRIPTION,
  DEFAULT_TITLE,
  stripTagsForMeta,
  truncateMetaDescription,
} from '../shared/siteMeta.ts'
import {
  buildArticleRouteSlugs,
  decodeHtml,
  sortIndexedArticles,
} from '../shared/siteArticlesRouting.ts'

const DEFAULT_DIST_DIR = path.resolve(process.cwd(), 'dist')
const DEFAULT_ARTICLES_PATH = path.resolve(process.cwd(), 'src/data/siteArticles.json')

export function stripExistingSeoHead(html) {
  return html
    .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
    .replace(/<meta\s+name="description"[\s\S]*?>\s*/gi, '')
    .replace(/<meta\s+name="robots"[\s\S]*?>\s*/gi, '')
    .replace(/<meta\s+name="author"[\s\S]*?>\s*/gi, '')
    .replace(/<link\s+rel="canonical"[\s\S]*?>\s*/gi, '')
    .replace(/<meta\s+property="og:[\s\S]*?>\s*/gi, '')
    .replace(/<meta\s+name="twitter:[\s\S]*?>\s*/gi, '')
    .replace(/<script\s+type="application\/ld\+json">[\s\S]*?<\/script>\s*/gi, '')
}

export function injectSeoHead(
  html,
  { title, description, url, imageAbs, ogType, jsonLd = null, robots = 'index, follow' },
) {
  const twitterCard = imageAbs ? 'summary_large_image' : 'summary'
  const tags = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtmlAttr(description)}" />`,
    `<meta name="robots" content="${escapeHtmlAttr(robots)}" />`,
    `<meta name="author" content="Ron Picard" />`,
    `<link rel="canonical" href="${escapeHtmlAttr(url)}" />`,
    `<meta property="og:title" content="${escapeHtmlAttr(title)}" />`,
    `<meta property="og:description" content="${escapeHtmlAttr(description)}" />`,
    `<meta property="og:url" content="${escapeHtmlAttr(url)}" />`,
    `<meta property="og:type" content="${escapeHtmlAttr(ogType)}" />`,
    `<meta property="og:site_name" content="Ron Picard" />`,
    `<meta property="og:locale" content="en_US" />`,
    imageAbs ? `<meta property="og:image" content="${escapeHtmlAttr(imageAbs)}" />` : '',
    imageAbs ? `<meta property="og:image:secure_url" content="${escapeHtmlAttr(imageAbs)}" />` : '',
    `<meta name="twitter:card" content="${escapeHtmlAttr(twitterCard)}" />`,
    `<meta name="twitter:title" content="${escapeHtmlAttr(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtmlAttr(description)}" />`,
    imageAbs ? `<meta name="twitter:image" content="${escapeHtmlAttr(imageAbs)}" />` : '',
    jsonLd
      ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`
      : '',
  ]
    .filter(Boolean)
    .join('\n')

  const cleaned = stripExistingSeoHead(html)
  return cleaned.replace(/<\/head>/i, `${tags}\n</head>`)
}

async function writeOut(distDir, relPath, html) {
  const outFile = path.join(distDir, relPath)
  await mkdir(path.dirname(outFile), { recursive: true })
  await writeFile(outFile, html, 'utf8')
}

export async function main({
  distDir = DEFAULT_DIST_DIR,
  articlesPath = DEFAULT_ARTICLES_PATH,
} = {}) {
  const template = await readFile(path.join(distDir, 'index.html'), 'utf8')
  const rows = parseSiteArticleRows(
    JSON.parse(await readFile(articlesPath, 'utf8')),
    'prerender site articles',
  )

  const home = injectSeoHead(template, {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    url: canonicalUrl('/'),
    imageAbs: absoluteAssetUrl('resources/82f3c8eae802c3.jpg') ?? null,
    ogType: 'website',
    jsonLd: homeJsonLd(),
  })
  await writeOut(distDir, 'index.html', home)

  const indexed = rows.map((row, sourceIndex) => ({ row, sourceIndex }))
  const sorted = sortIndexedArticles(indexed).map((x) => x.row)
  const decodedTitles = sorted.map((r) => decodeHtml(r.title))
  const { routeSlugs, legacyRouteSlugs } = buildArticleRouteSlugs(sorted)

  for (let i = 0; i < sorted.length; i++) {
    const row = sorted[i]
    const slug = routeSlugs[i]
    const title = decodedTitles[i]
    const summary =
      truncateMetaDescription(stripTagsForMeta(row.summary || '')) || title
    const ogImage = row.articleHeroUrl || row.imageUrl || null
    const imageAbs = absoluteAssetUrl(ogImage) ?? null
    const route = `/blog/${slug}`

    const html = injectSeoHead(template, {
      title: `${title} | Ron Picard`,
      description: summary,
      url: canonicalUrl(route),
      imageAbs,
      ogType: 'article',
      jsonLd: articleJsonLd({
        title,
        date: row.date,
        description: summary,
        path: route,
      }),
    })

    await writeOut(distDir, path.join('blog', slug, 'index.html'), html)

    const leg = legacyRouteSlugs[i]
    if (leg !== slug) {
      await writeOut(distDir, path.join('blog', leg, 'index.html'), html)
    }
  }

  const sitemapEntries = [
    { url: canonicalUrl('/') },
    ...sorted.map((row, index) => ({
      url: canonicalUrl(`/blog/${routeSlugs[index]}`),
      lastModified: row.date,
    })),
  ]
  await writeFile(
    path.join(distDir, 'sitemap.xml'),
    buildSitemapXml(sitemapEntries),
    'utf8',
  )
  await writeFile(
    path.join(distDir, 'robots.txt'),
    buildRobotsTxt(canonicalUrl('/sitemap.xml')),
    'utf8',
  )

  const notFound = injectSeoHead(template, {
    title: 'Page not found | Ron Picard',
    description: 'The requested page could not be found.',
    url: canonicalUrl('/'),
    imageAbs: null,
    ogType: 'website',
    robots: 'noindex, nofollow',
  })
  await writeOut(distDir, '404.html', notFound)
}

const isMainModule = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
if (isMainModule) {
  main().catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
}
