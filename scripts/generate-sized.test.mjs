import { mkdir, mkdtemp, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import { afterEach, describe, expect, it } from 'vitest'
import { main } from './generate-sized.mjs'

const temporaryDirectories = []

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((d) => rm(d, { force: true, recursive: true })),
  )
})

function articleRow(overrides = {}) {
  return {
    slug: 'demo-article',
    title: 'Demo article',
    date: '2026-01-01',
    summary: null,
    imageUrl: null,
    articleHeroUrl: null,
    githubEmbed: null,
    demoUrl: null,
    repoUrl: null,
    youtubeId: null,
    otherEmbed: null,
    extraLinks: [],
    ...overrides,
  }
}

async function makeFixture(rows, bodies = {}) {
  const root = await mkdtemp(path.join(tmpdir(), 'sized-'))
  temporaryDirectories.push(root)
  const publicDir = path.join(root, 'public')
  await mkdir(path.join(publicDir, 'resources'), { recursive: true })
  await mkdir(path.join(publicDir, 'article-bodies'), { recursive: true })
  for (const [name, html] of Object.entries(bodies)) {
    await writeFile(path.join(publicDir, 'article-bodies', name), html, 'utf8')
  }
  const articlesPath = path.join(root, 'siteArticles.json')
  await writeFile(articlesPath, JSON.stringify(rows), 'utf8')
  return { publicDir, articlesPath }
}

async function writeTestImage(publicDir, name, width, height) {
  await sharp({
    create: { width, height, channels: 3, background: { r: 40, g: 90, b: 160 } },
  })
    .png()
    .toFile(path.join(publicDir, 'resources', name))
}

describe('generate-sized', () => {
  it('writes every width for hero/title images and body images, never enlarging', async () => {
    const rows = [
      articleRow({ slug: 'a', imageUrl: 'resources/card.png', articleHeroUrl: 'resources/hero.png' }),
      articleRow({ slug: 'b', imageUrl: 'https://img.youtube.com/vi/abc123/maxresdefault.jpg' }),
    ]
    const { publicDir, articlesPath } = await makeFixture(rows, {
      'a.html':
        '<p><img alt="x" src="resources/inline.png"><img src="resources/figure.svg"><img src="resources/anim.gif"></p>',
    })
    await writeTestImage(publicDir, 'hero.png', 2400, 1200)
    await writeTestImage(publicDir, 'inline.png', 1000, 500)

    const summary = await main({ publicDir, articlesPath })

    const width = async (f) =>
      (await sharp(path.join(publicDir, 'resources/sized', f)).metadata()).width
    expect(await width('hero-768.webp')).toBe(768)
    expect(await width('hero-1920.webp')).toBe(1920)
    expect(await width('inline-768.webp')).toBe(768)
    expect(await width('inline-1920.webp')).toBe(1000)
    expect(summary.written).toBe(6)
    expect(summary.missing).toBe(0) // hero wins over the absent title image
  })

  it('is idempotent and tolerates missing sources', async () => {
    const rows = [articleRow({ imageUrl: 'resources/big.png' }), articleRow({ imageUrl: 'resources/gone.png' })]
    const { publicDir, articlesPath } = await makeFixture(rows)
    await writeTestImage(publicDir, 'big.png', 1500, 800)

    await main({ publicDir, articlesPath })
    const file = path.join(publicDir, 'resources/sized/big-1280.webp')
    const first = (await stat(file)).mtimeMs
    const summary = await main({ publicDir, articlesPath })
    expect(summary.written).toBe(0)
    expect(summary.skipped).toBe(3)
    expect(summary.missing).toBe(1)
    expect((await stat(file)).mtimeMs).toBe(first)
  })
})
