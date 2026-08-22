import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
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

    await main({ distDir, articlesPath })

    const routeHtml = await readFile(path.join(distDir, 'blog/example-post/index.html'), 'utf8')
    const notFoundHtml = await readFile(path.join(distDir, '404.html'), 'utf8')
    const sitemap = await readFile(path.join(distDir, 'sitemap.xml'), 'utf8')
    const robots = await readFile(path.join(distDir, 'robots.txt'), 'utf8')
    expect(routeHtml).toContain('<title>Example Post | Ron Picard</title>')
    expect(routeHtml).toContain('application/ld+json')
    expect(notFoundHtml).toContain('content="noindex, nofollow"')
    expect(sitemap).toContain('https://ronpicard.com/blog/example-post')
    expect(robots).toContain('https://ronpicard.com/sitemap.xml')
  })
})
