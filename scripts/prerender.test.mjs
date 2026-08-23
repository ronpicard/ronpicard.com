import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
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

describe('prerender main', () => {
  it('writes route metadata, sitemap, robots, and a noindex 404 page', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'ronpicard-prerender-'))
    temporaryDirectories.push(root)
    const distDir = path.join(root, 'dist')
    const articlesPath = path.join(root, 'siteArticles.json')
    await import('node:fs/promises').then(({ mkdir }) => mkdir(distDir, { recursive: true }))
    await writeFile(
      path.join(distDir, 'index.html'),
      '<!doctype html><html><head><title>Template</title></head><body><main></main></body></html>',
      'utf8',
    )
    await writeFile(
      articlesPath,
      JSON.stringify([
        {
          slug: 'example-post',
          title: 'Example Post',
          date: '2026-08-22',
          summary: 'Example summary',
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

    expect(homeHtml).toContain(`<title>${DEFAULT_TITLE}</title>`)
    expect(homeHtml).toContain('property="og:type" content="website"')
    expect(homeHtml).toContain('"@type":"WebSite"')

    expect(routeHtml).toContain('<title>Example Post | Ron Picard</title>')
    expect(routeHtml).toContain('property="og:type" content="article"')
    expect(routeHtml).toContain('property="og:url" content="https://ronpicard.com/blog/example-post"')
    expect(routeHtml).toContain('property="og:image" content="https://ronpicard.com/resources/example.png"')
    expect(routeHtml).toContain('"@type":"BlogPosting"')

    expect(legacyHtml).toContain('<title>Example App | Ron Picard</title>')
    expect(legacyHtml).toContain('property="og:url" content="https://ronpicard.com/blog/example-app"')

    expect(notFoundHtml).toContain('content="noindex, nofollow"')
    expect(sitemap).toContain('https://ronpicard.com/blog/example-post')
    expect(sitemap).toContain('https://ronpicard.com/blog/example-app')
    expect(sitemap).not.toContain('example-app-web-app')
    expect(robots).toContain('https://ronpicard.com/sitemap.xml')
  })
})
