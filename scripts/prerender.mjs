import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import {
  ARTICLE_TOPICS,
  deriveArticleKind,
  resolveArticleTopic,
  topicPath,
} from '../shared/articleTopics.ts'
import { buildRssFeed } from '../shared/feed.ts'
import { postShareImage, resourceOgPath } from '../shared/resourceOgImages.ts'
import {
  articleSeoInput,
  buildSeoHeadTags,
  HOME_SEO_IMAGE,
  homeSeoInput,
  notFoundSeoInput,
  serializeHeadTag,
  topicSeoInput,
} from '../shared/seoHead.ts'
import { parseSiteArticleRows } from '../shared/siteArticleSchema.ts'
import { buildRobotsTxt, buildSitemapXml } from '../shared/sitemap.ts'
import { canonicalUrl, DEFAULT_DESCRIPTION } from '../shared/siteMeta.ts'
import {
  articlePath,
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
    .replace(/<meta\s+property="article:[\s\S]*?>\s*/gi, '')
    .replace(/<meta\s+name="twitter:[\s\S]*?>\s*/gi, '')
    .replace(/<script\s+type="application\/ld\+json">[\s\S]*?<\/script>\s*/gi, '')
}

/** Replace the template's SEO tags with the route's (shared/seoHead builds both client and static sets). */
export function injectSeoHead(html, input) {
  const tags = buildSeoHeadTags(input).map(serializeHeadTag).join('\n')
  const cleaned = stripExistingSeoHead(html)
  return cleaned.replace(/<\/head>/i, `${tags}\n</head>`)
}

const EMPTY_ROOT_DIV = '<div id="root"></div>'
const DEFAULT_SERVER_ENTRY = path.resolve(process.cwd(), 'dist-server/entry-server.js')

/**
 * Fill #root with the prerendered app markup (from entry-server's render) and
 * hoist its priority-image preload links into <head>, so first paint shows
 * real content before the client bundle hydrates.
 */
export function injectAppHtml(html, { appHtml, preloadLinks }) {
  if (!html.includes(EMPTY_ROOT_DIV)) {
    throw new Error(`prerender: template has no empty ${EMPTY_ROOT_DIV} to fill`)
  }
  const withPreloads = preloadLinks
    ? html.replace(/<\/head>/i, `${preloadLinks}\n</head>`)
    : html
  return withPreloads.replace(EMPTY_ROOT_DIV, `<div id="root">${appHtml}</div>`)
}

/** render() from the vite-built SSR bundle (build:full runs that build first). */
async function loadServerRender(serverEntry = DEFAULT_SERVER_ENTRY) {
  const module_ = await import(pathToFileURL(serverEntry).href)
  if (typeof module_.render !== 'function') {
    throw new Error(`prerender: ${serverEntry} does not export a render function`)
  }
  return module_.render
}

async function writeOut(distDir, relPath, html) {
  const outFile = path.join(distDir, relPath)
  await mkdir(path.dirname(outFile), { recursive: true })
  await writeFile(outFile, html, 'utf8')
}

/**
 * Pixel dimensions for a mirrored `resources/...` image in dist/, or null when
 * the path is remote/missing/unreadable (dims are an enhancement, not a gate).
 */
async function localImageDims(distDir, imageRel) {
  const rel = String(imageRel || '').replace(/^\/+/, '')
  if (!/^resources\/(?:og\/)?[a-z0-9][a-z0-9._-]*$/i.test(rel)) return null
  try {
    const { default: sharp } = await import('sharp')
    const meta = await sharp(path.join(distDir, rel)).metadata()
    if (!meta.width || !meta.height) return null
    return { width: meta.width, height: meta.height }
  } catch {
    return null
  }
}

/** Raw HTML of a post's extracted body from dist/, or null (bodies are an enhancement, not a gate). */
async function readArticleBody(distDir, bodyPath) {
  if (!/^article-bodies\/[a-z0-9._-]+\.html$/i.test(bodyPath || '')) return null
  try {
    return await readFile(path.join(distDir, bodyPath), 'utf8')
  } catch {
    return null
  }
}

export async function main({
  distDir = DEFAULT_DIST_DIR,
  articlesPath = DEFAULT_ARTICLES_PATH,
  /** entry-server render(url, options); null writes head-only pages with an empty #root. */
  render = null,
} = {}) {
  const template = await readFile(path.join(distDir, 'index.html'), 'utf8')
  const renderRoute = async (html, route, options) =>
    render ? injectAppHtml(html, await render(route, options)) : html
  const rows = parseSiteArticleRows(
    JSON.parse(await readFile(articlesPath, 'utf8')),
    'prerender site articles',
  )

  const home = injectSeoHead(template, homeSeoInput(await localImageDims(distDir, HOME_SEO_IMAGE)))
  await writeOut(distDir, 'index.html', await renderRoute(home, '/'))

  const indexed = rows.map((row, sourceIndex) => ({ row, sourceIndex }))
  const sorted = sortIndexedArticles(indexed).map((x) => x.row)
  const { routeSlugs, legacyRouteSlugs } = buildArticleRouteSlugs(sorted)
  // Same decoded fields the app's article data uses (src/data/articles.ts).
  const decoded = sorted.map((row, i) => ({
    ...row,
    slug: routeSlugs[i],
    title: decodeHtml(row.title),
    summary: row.summary ? decodeHtml(row.summary) : null,
    topic: resolveArticleTopic(row, deriveArticleKind(row)),
  }))

  for (let i = 0; i < sorted.length; i++) {
    const article = decoded[i]
    const slug = article.slug
    // Share the generated 1200×630 card when build:full made one, else the original.
    const shareImage = postShareImage(article)
    const cardRel = resourceOgPath(shareImage)
    const cardDims = cardRel ? await localImageDims(distDir, cardRel) : null
    const dims = cardDims ?? (shareImage ? await localImageDims(distDir, shareImage) : null)
    const html = injectSeoHead(
      template,
      articleSeoInput(article, {
        rel: cardDims ? cardRel : shareImage,
        width: dims?.width ?? null,
        height: dims?.height ?? null,
      }),
    )
    const body = await readArticleBody(distDir, article.bodyPath)
    const options = body ? { articleBodies: { [article.bodyPath]: body } } : {}

    await writeOut(
      distDir,
      path.join('blog', slug, 'index.html'),
      await renderRoute(html, articlePath(slug), options),
    )

    const leg = legacyRouteSlugs[i]
    if (leg !== slug) {
      // Rendered for its own URL so hydration on the legacy route matches.
      await writeOut(
        distDir,
        path.join('blog', leg, 'index.html'),
        await renderRoute(html, articlePath(leg), options),
      )
    }
  }

  const newest = (list) => list.reduce((max, a) => (a.date > max ? a.date : max), '') || null
  const topicEntries = []
  for (const topic of ARTICLE_TOPICS) {
    const inTopic = decoded.filter((a) => a.topic === topic.slug)
    if (inTopic.length === 0) continue
    await writeOut(
      distDir,
      path.join('topics', topic.slug, 'index.html'),
      await renderRoute(injectSeoHead(template, topicSeoInput(topic, inTopic)), topicPath(topic.slug)),
    )
    topicEntries.push({ url: canonicalUrl(topicPath(topic.slug)), lastModified: newest(inTopic) })
  }

  // Thin posts stay reachable but are noindex, so the sitemap leaves them out.
  const sitemapEntries = [
    { url: canonicalUrl('/'), lastModified: newest(decoded) },
    ...topicEntries,
    ...decoded
      .filter((article) => !article.noindex)
      .map((article) => ({
        url: canonicalUrl(articlePath(article.slug)),
        lastModified: article.date,
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
  await writeFile(
    path.join(distDir, 'feed.xml'),
    buildRssFeed({
      title: 'Ron Picard',
      description: DEFAULT_DESCRIPTION,
      siteUrl: canonicalUrl('/'),
      feedUrl: canonicalUrl('/feed.xml'),
      items: decoded.map((article) => {
        const seo = articleSeoInput(article)
        return {
          title: article.title,
          url: seo.url,
          description: seo.description,
          date: article.date,
        }
      }),
    }),
    'utf8',
  )

  await writeOut(distDir, '404.html', injectSeoHead(template, notFoundSeoInput()))
}

const isMainModule = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
if (isMainModule) {
  loadServerRender()
    .then((render) => main({ render }))
    // The imported SSR bundle keeps the event loop alive; exit explicitly
    // (all writes above are awaited before main resolves).
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}
