import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { escapeHtml } from '../shared/htmlEscape.ts'
import { DEFAULT_TITLE } from '../shared/siteMeta.ts'
import { injectSeoHead, main, stripExistingSeoHead } from './prerender.mjs'

const temporaryDirectories = []

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { force: true, recursive: true }),
    ),
  )
})

describe('SEO head helpers', () => {
  it('replaces existing SEO tags and safely serializes JSON-LD', () => {
    const template =
      '<html><head><title>Old</title><meta name="description" content="old"></head><body></body></html>'
    const output = injectSeoHead(template, {
      title: 'New <title>',
      description: 'Description',
      url: 'https://ronpicard.com/',
      imageAbs: null,
      ogType: 'website',
      jsonLd: { value: '</script>' },
    })

    expect(output.match(/<title>/g)).toHaveLength(1)
    expect(output).toContain('<title>New &lt;title&gt;</title>')
    expect(output).toContain('\\u003c/script>')
    expect(stripExistingSeoHead(output)).not.toContain('application/ld+json')
  })
})

async function writeFixture(root, { template }) {
  const distDir = path.join(root, 'dist')
  const articlesPath = path.join(root, 'siteArticles.json')
  await import('node:fs/promises').then(({ mkdir }) =>
    mkdir(path.join(distDir, 'resources'), { recursive: true }),
  )
  await writeFile(path.join(distDir, 'index.html'), template, 'utf8')
  return { distDir, articlesPath }
}

describe('prerender main', () => {
  it('writes route metadata, sitemap, robots, and a noindex 404 page', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'ronpicard-prerender-'))
    temporaryDirectories.push(root)
    const { distDir, articlesPath } = await writeFixture(root, {
      template:
        '<!doctype html><html><head><title>Template</title></head><body><main></main></body></html>',
    })
    const { default: sharp } = await import('sharp')
    await writeFile(
      path.join(distDir, 'resources/example.png'),
      await sharp({ create: { width: 3, height: 2, channels: 3, background: '#000' } })
        .png()
        .toBuffer(),
    )
    await writeFile(
      articlesPath,
      JSON.stringify([
        {
          slug: 'example-post',
          title: 'Example Post',
          date: '2026-08-22',
          summary: 'Stack &amp; Heap &quot;basics&quot;',
          bodyPath: null,
          imageUrl: 'resources/example.png',
          articleHeroUrl: null,
          githubEmbed: null,
          demoUrl: null,
          repoUrl: null,
          youtubeId: null,
          otherEmbed: null,
          readmeRawUrl: null,
          extraLinks: [],
        },
        {
          slug: 'example-app',
          title: 'Example App',
          date: '2026-03-22',
          summary: 'Example app summary',
          bodyPath: null,
          imageUrl: null,
          articleHeroUrl: null,
          githubEmbed: 'https://ronpicard.github.io/example-app/',
          demoUrl: null,
          repoUrl: null,
          youtubeId: null,
          otherEmbed: null,
          readmeRawUrl: null,
          extraLinks: [],
        },
      ]),
      'utf8',
    )

    await main({ distDir, articlesPath })

    const homeHtml = await readFile(path.join(distDir, 'index.html'), 'utf8')
    const routeHtml = await readFile(path.join(distDir, 'blog/example-post/index.html'), 'utf8')
    const legacyHtml = await readFile(
      path.join(distDir, 'blog/example-app-web-app/index.html'),
      'utf8',
    )
    const notFoundHtml = await readFile(path.join(distDir, '404.html'), 'utf8')
    const sitemap = await readFile(path.join(distDir, 'sitemap.xml'), 'utf8')
    const robots = await readFile(path.join(distDir, 'robots.txt'), 'utf8')

    expect(homeHtml).toContain(`<title>${escapeHtml(DEFAULT_TITLE)}</title>`)
    expect(homeHtml).toContain('property="og:type" content="website"')
    expect(homeHtml).toContain('"@type":"WebSite"')

    expect(routeHtml).toContain('<title>Example Post | Ron Picard</title>')
    expect(routeHtml).toContain('property="og:type" content="article"')
    expect(routeHtml).toContain('property="og:url" content="https://ronpicard.com/blog/example-post/"')
    expect(routeHtml).toContain('property="og:image" content="https://ronpicard.com/resources/example.png"')
    expect(routeHtml).toContain('property="og:image:width" content="3"')
    expect(routeHtml).toContain('property="og:image:height" content="2"')
    expect(routeHtml).toContain('property="og:image:alt" content="Example Post"')
    expect(routeHtml).toContain('name="twitter:image:alt" content="Example Post"')
    expect(routeHtml).toContain('"@type":"BlogPosting"')
    // Summaries are entity-decoded once, then attribute-escaped once.
    expect(routeHtml).toContain('name="description" content="Stack &amp; Heap &quot;basics&quot;"')
    expect(routeHtml).toContain('"description":"Stack & Heap \\"basics\\""')
    expect(routeHtml).toContain('property="article:published_time" content="2026-08-22T12:00:00.000Z"')
    expect(homeHtml).not.toContain('article:published_time')

    expect(legacyHtml).toContain('<title>Example App | Ron Picard</title>')
    expect(legacyHtml).toContain('property="og:url" content="https://ronpicard.com/blog/example-app/"')
    // The example-app row has no image, so no dimension or alt tags are emitted.
    expect(legacyHtml).not.toContain('og:image:width')

    expect(notFoundHtml).toContain('content="noindex, nofollow"')
    expect(sitemap).toContain('https://ronpicard.com/blog/example-post/')
    expect(sitemap).toContain('https://ronpicard.com/blog/example-app/')
    expect(sitemap).not.toContain('example-app-web-app')
    expect(robots).toContain('https://ronpicard.com/sitemap.xml')
    // Home's lastmod is the newest post's date.
    expect(sitemap).toContain('<loc>https://ronpicard.com/</loc>\n    <lastmod>2026-08-22</lastmod>')

    const feed = await readFile(path.join(distDir, 'feed.xml'), 'utf8')
    expect(feed).toContain('<atom:link href="https://ronpicard.com/feed.xml"')
    expect(feed).toContain('<link>https://ronpicard.com/blog/example-post/</link>')
    expect(feed).toContain('<description>Stack &amp; Heap &quot;basics&quot;</description>')
    expect(feed).toContain('<link>https://ronpicard.com/blog/example-app/</link>')
  })

  it('writes topic hub pages, links posts to their topic, and keeps noindex posts out of the sitemap', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'ronpicard-prerender-'))
    temporaryDirectories.push(root)
    const { distDir, articlesPath } = await writeFixture(root, {
      template:
        '<!doctype html><html><head><title>Template</title></head><body><main></main></body></html>',
    })
    const row = {
      summary: 'Summary',
      bodyPath: null,
      imageUrl: null,
      articleHeroUrl: null,
      githubEmbed: null,
      demoUrl: null,
      repoUrl: null,
      youtubeId: null,
      otherEmbed: null,
      readmeRawUrl: null,
      extraLinks: [],
    }
    await writeFile(
      articlesPath,
      JSON.stringify([
        {
          ...row,
          slug: 'flying-post',
          title: 'Flying Post',
          date: '2026-05-01',
          topic: 'aviation',
          seoTitle: 'Flying Post: Search Title',
        },
        {
          ...row,
          slug: 'thin-post',
          title: 'Thin Post',
          date: '2026-06-01',
          topic: 'aviation',
          noindex: true,
        },
        {
          ...row,
          slug: 'example-app',
          title: 'Example App',
          date: '2026-03-22',
          githubEmbed: 'https://ronpicard.github.io/example-app/',
        },
      ]),
      'utf8',
    )

    await main({ distDir, articlesPath })

    const { access } = await import('node:fs/promises')
    const topicHtml = await readFile(path.join(distDir, 'topics/aviation/index.html'), 'utf8')
    expect(topicHtml).toContain('<title>Aviation &amp; Hobbies | Ron Picard</title>')
    expect(topicHtml).toContain('<link rel="canonical" href="https://ronpicard.com/topics/aviation/" />')
    expect(topicHtml).toContain('"@type":"CollectionPage"')
    expect(topicHtml).toContain('https://ronpicard.com/blog/flying-post/')
    expect(topicHtml).toContain('https://ronpicard.com/blog/thin-post/')

    await access(path.join(distDir, 'topics/web-apps-and-games/index.html'))
    await expect(
      access(path.join(distDir, 'topics/formal-methods-and-research/index.html')),
    ).rejects.toThrow()

    const flyingHtml = await readFile(path.join(distDir, 'blog/flying-post/index.html'), 'utf8')
    expect(flyingHtml).toContain('<title>Flying Post: Search Title | Ron Picard</title>')
    expect(flyingHtml).toContain('"item":"https://ronpicard.com/topics/aviation/"')

    const thinHtml = await readFile(path.join(distDir, 'blog/thin-post/index.html'), 'utf8')
    expect(thinHtml).toContain('name="robots" content="noindex, follow"')

    const sitemap = await readFile(path.join(distDir, 'sitemap.xml'), 'utf8')
    expect(sitemap).toContain(
      '<loc>https://ronpicard.com/topics/aviation/</loc>\n    <lastmod>2026-06-01</lastmod>',
    )
    expect(sitemap).toContain('https://ronpicard.com/blog/flying-post/')
    expect(sitemap).not.toContain('thin-post')
  })

  it('shares the generated og card, with its dimensions, when one exists', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'ronpicard-prerender-'))
    temporaryDirectories.push(root)
    const { distDir, articlesPath } = await writeFixture(root, {
      template: '<!doctype html><html><head><title>Template</title></head><body></body></html>',
    })
    const { mkdir } = await import('node:fs/promises')
    const { default: sharp } = await import('sharp')
    await mkdir(path.join(distDir, 'resources/og'), { recursive: true })
    await writeFile(
      path.join(distDir, 'resources/og/portrait.jpg'),
      await sharp({ create: { width: 1200, height: 630, channels: 3, background: '#000' } })
        .jpeg()
        .toBuffer(),
    )
    await writeFile(
      articlesPath,
      JSON.stringify([
        {
          slug: 'portrait-post',
          title: 'Portrait Post',
          date: '2026-08-22',
          summary: 'Summary',
          bodyPath: null,
          imageUrl: 'resources/portrait.png',
          articleHeroUrl: null,
          githubEmbed: null,
          demoUrl: null,
          repoUrl: null,
          youtubeId: null,
          otherEmbed: null,
          readmeRawUrl: null,
          extraLinks: [],
        },
      ]),
      'utf8',
    )

    await main({ distDir, articlesPath })

    const html = await readFile(path.join(distDir, 'blog/portrait-post/index.html'), 'utf8')
    expect(html).toContain('property="og:image" content="https://ronpicard.com/resources/og/portrait.jpg"')
    expect(html).toContain('name="twitter:image" content="https://ronpicard.com/resources/og/portrait.jpg"')
    expect(html).toContain('property="og:image:width" content="1200"')
    expect(html).toContain('property="og:image:height" content="630"')
  })

  it('injects per-route app markup and preload links when a render function is given', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'ronpicard-prerender-'))
    temporaryDirectories.push(root)
    const { distDir, articlesPath } = await writeFixture(root, {
      template:
        '<!doctype html><html><head><title>Template</title></head><body><div id="root"></div></body></html>',
    })
    await writeFile(
      articlesPath,
      JSON.stringify([
        {
          slug: 'example-post',
          title: 'Example Post',
          date: '2026-08-22',
          summary: 'Example summary',
          bodyPath: null,
          imageUrl: null,
          articleHeroUrl: null,
          githubEmbed: null,
          demoUrl: null,
          repoUrl: null,
          youtubeId: null,
          otherEmbed: null,
          readmeRawUrl: null,
          extraLinks: [],
        },
      ]),
      'utf8',
    )

    const renderedUrls = []
    const render = async (url) => {
      renderedUrls.push(url)
      return {
        appHtml: `<div class="app-content" data-url="${url}"></div>`,
        preloadLinks: '<link rel="preload" as="image" href="/resources/thumbs/x.webp" fetchpriority="high" />',
      }
    }

    await main({ distDir, articlesPath, render })

    const homeHtml = await readFile(path.join(distDir, 'index.html'), 'utf8')
    expect(homeHtml).toContain('<div id="root"><div class="app-content" data-url="/"></div></div>')
    expect(homeHtml).toContain('rel="preload"')
    expect(homeHtml.indexOf('rel="preload"')).toBeLessThan(homeHtml.indexOf('</head>'))

    const routeHtml = await readFile(path.join(distDir, 'blog/example-post/index.html'), 'utf8')
    expect(routeHtml).toContain('data-url="/blog/example-post/"')
    expect(renderedUrls).toContain('/blog/example-post/')

    // The 404 page has no route to render; its root stays empty.
    const notFoundHtml = await readFile(path.join(distDir, '404.html'), 'utf8')
    expect(notFoundHtml).toContain('<div id="root"></div>')
  })

  it('hands each post its article body file to render', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'ronpicard-prerender-'))
    temporaryDirectories.push(root)
    const { distDir, articlesPath } = await writeFixture(root, {
      template:
        '<!doctype html><html><head><title>Template</title></head><body><div id="root"></div></body></html>',
    })
    const { mkdir } = await import('node:fs/promises')
    await mkdir(path.join(distDir, 'article-bodies'), { recursive: true })
    await writeFile(path.join(distDir, 'article-bodies/with-body.html'), '<p>Body text</p>', 'utf8')
    const row = {
      date: '2026-08-22',
      summary: 'Summary',
      imageUrl: null,
      articleHeroUrl: null,
      githubEmbed: null,
      demoUrl: null,
      repoUrl: null,
      youtubeId: null,
      otherEmbed: null,
      readmeRawUrl: null,
      extraLinks: [],
    }
    await writeFile(
      articlesPath,
      JSON.stringify([
        { ...row, slug: 'with-body', title: 'With Body', bodyPath: 'article-bodies/with-body.html' },
        { ...row, slug: 'missing-body', title: 'Missing Body', bodyPath: 'article-bodies/missing.html' },
      ]),
      'utf8',
    )

    const calls = new Map()
    const render = async (url, options) => {
      calls.set(url, options)
      return { appHtml: '<div class="app-content"></div>', preloadLinks: '' }
    }
    await main({ distDir, articlesPath, render })

    expect(calls.get('/blog/with-body/')).toEqual({
      articleBodies: { 'article-bodies/with-body.html': '<p>Body text</p>' },
    })
    // A missing body file is not fatal: the page falls back to the client fetch.
    expect(calls.get('/blog/missing-body/')).toEqual({})
  })

  it('leaves the root div empty when no render function is given', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'ronpicard-prerender-'))
    temporaryDirectories.push(root)
    const { distDir, articlesPath } = await writeFixture(root, {
      template:
        '<!doctype html><html><head><title>Template</title></head><body><div id="root"></div></body></html>',
    })
    await writeFile(articlesPath, JSON.stringify([]), 'utf8')

    await main({ distDir, articlesPath })

    const homeHtml = await readFile(path.join(distDir, 'index.html'), 'utf8')
    expect(homeHtml).toContain('<div id="root"></div>')
  })
})
