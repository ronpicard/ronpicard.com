import { mkdir, mkdtemp, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import { afterEach, describe, expect, it } from 'vitest'
import { main } from './generate-og-images.mjs'

const temporaryDirectories = []

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { force: true, recursive: true }),
    ),
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

async function makeFixture(rows) {
  const root = await mkdtemp(path.join(tmpdir(), 'og-'))
  temporaryDirectories.push(root)
  const publicDir = path.join(root, 'public')
  await mkdir(path.join(publicDir, 'resources'), { recursive: true })
  const articlesPath = path.join(root, 'siteArticles.json')
  await writeFile(articlesPath, JSON.stringify(rows), 'utf8')
  return { publicDir, articlesPath }
}

async function writeTestImage(publicDir, name, width, height, background = { r: 40, g: 90, b: 160 }) {
  await sharp({ create: { width, height, channels: 3, background } })
    .png()
    .toFile(path.join(publicDir, 'resources', name))
}

async function cardMeta(publicDir, name) {
  return sharp(path.join(publicDir, 'resources/og', name)).metadata()
}

describe('generate-og-images', () => {
  it('writes a 1200x630 jpeg card for each local share image, preferring the hero', async () => {
    const rows = [
      articleRow({ slug: 'a', imageUrl: 'resources/title.png', articleHeroUrl: 'resources/hero.png' }),
      articleRow({ slug: 'b', imageUrl: 'resources/wide.png' }),
      articleRow({ slug: 'c', imageUrl: 'https://img.youtube.com/vi/abc123/maxresdefault.jpg' }),
      articleRow({ slug: 'd', imageUrl: null }),
    ]
    const { publicDir, articlesPath } = await makeFixture(rows)
    await writeTestImage(publicDir, 'hero.png', 1920, 1080)
    await writeTestImage(publicDir, 'wide.png', 1600, 900)

    const summary = await main({ publicDir, articlesPath })

    for (const name of ['hero.jpg', 'wide.jpg']) {
      const meta = await cardMeta(publicDir, name)
      expect(meta).toMatchObject({ format: 'jpeg', width: 1200, height: 630 })
    }
    await expect(stat(path.join(publicDir, 'resources/og/title.jpg'))).rejects.toThrow()
    expect(summary).toEqual({ written: 2, skipped: 0, missing: 0 })
  })

  it('shows portrait and small images whole over a dimmed backdrop', async () => {
    const rows = [
      articleRow({ slug: 'p', imageUrl: 'resources/portrait.png' }),
      articleRow({ slug: 's', imageUrl: 'resources/small.png' }),
    ]
    const { publicDir, articlesPath } = await makeFixture(rows)
    const white = { r: 255, g: 255, b: 255 }
    await writeTestImage(publicDir, 'portrait.png', 600, 800, white)
    await writeTestImage(publicDir, 'small.png', 300, 200, white)

    await main({ publicDir, articlesPath })

    const card = sharp(path.join(publicDir, 'resources/og/portrait.jpg'))
    expect(await card.metadata()).toMatchObject({ width: 1200, height: 630 })
    const { data, info } = await card.raw().toBuffer({ resolveWithObject: true })
    const pixel = (x, y) => data[(y * info.width + x) * info.channels]
    expect(pixel(600, 315)).toBeGreaterThan(240) // the image itself, uncropped at centre
    expect(pixel(20, 315)).toBeLessThan(160) // dimmed backdrop in the side margin
    expect(await cardMeta(publicDir, 'small.jpg')).toMatchObject({ width: 1200, height: 630 })
  })

  it('is idempotent: an up-to-date card is not rewritten', async () => {
    const rows = [articleRow({ imageUrl: 'resources/wide.png' })]
    const { publicDir, articlesPath } = await makeFixture(rows)
    await writeTestImage(publicDir, 'wide.png', 1600, 900)

    await main({ publicDir, articlesPath })
    const cardFile = path.join(publicDir, 'resources/og/wide.jpg')
    const firstMtime = (await stat(cardFile)).mtimeMs

    const summary = await main({ publicDir, articlesPath })
    expect(summary.written).toBe(0)
    expect(summary.skipped).toBe(1)
    expect((await stat(cardFile)).mtimeMs).toBe(firstMtime)
  })

  it('skips (and reports) share images that are missing on disk', async () => {
    const rows = [articleRow({ imageUrl: 'resources/gone.png' })]
    const { publicDir, articlesPath } = await makeFixture(rows)

    const summary = await main({ publicDir, articlesPath })
    expect(summary).toEqual({ written: 0, skipped: 0, missing: 1 })
  })
})
