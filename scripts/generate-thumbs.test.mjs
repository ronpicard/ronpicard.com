import { mkdir, mkdtemp, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import sharp from 'sharp'
import { afterEach, describe, expect, it } from 'vitest'
import { main } from './generate-thumbs.mjs'

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
  const root = await mkdtemp(path.join(tmpdir(), 'thumbs-'))
  temporaryDirectories.push(root)
  const publicDir = path.join(root, 'public')
  await mkdir(path.join(publicDir, 'resources'), { recursive: true })
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

describe('generate-thumbs', () => {
  it('writes a downscaled webp thumbnail for each local title image', async () => {
    const rows = [
      articleRow({ slug: 'a', imageUrl: 'resources/big-card.png' }),
      articleRow({ slug: 'b', imageUrl: 'https://img.youtube.com/vi/abc123/maxresdefault.jpg' }),
      articleRow({ slug: 'c', imageUrl: null }),
    ]
    const { publicDir, articlesPath } = await makeFixture(rows)
    await writeTestImage(publicDir, 'big-card.png', 1920, 1080)

    const summary = await main({ publicDir, articlesPath })

    const thumbFile = path.join(publicDir, 'resources/thumbs/big-card.webp')
    const meta = await sharp(thumbFile).metadata()
    expect(meta.format).toBe('webp')
    expect(meta.width).toBe(768)
    expect(summary.written).toBe(1)
    expect(summary.skipped).toBe(0)
  })

  it('never upscales images narrower than the thumbnail width', async () => {
    const rows = [articleRow({ imageUrl: 'resources/small.png' })]
    const { publicDir, articlesPath } = await makeFixture(rows)
    await writeTestImage(publicDir, 'small.png', 300, 200)

    await main({ publicDir, articlesPath })

    const meta = await sharp(path.join(publicDir, 'resources/thumbs/small.webp')).metadata()
    expect(meta.width).toBe(300)
  })

  it('is idempotent: an up-to-date thumbnail is not rewritten', async () => {
    const rows = [articleRow({ imageUrl: 'resources/big-card.png' })]
    const { publicDir, articlesPath } = await makeFixture(rows)
    await writeTestImage(publicDir, 'big-card.png', 1920, 1080)

    await main({ publicDir, articlesPath })
    const thumbFile = path.join(publicDir, 'resources/thumbs/big-card.webp')
    const firstMtime = (await stat(thumbFile)).mtimeMs

    const summary = await main({ publicDir, articlesPath })
    expect(summary.written).toBe(0)
    expect((await stat(thumbFile)).mtimeMs).toBe(firstMtime)
  })

  it('skips (and reports) title images that are missing on disk', async () => {
    const rows = [articleRow({ imageUrl: 'resources/gone.png' })]
    const { publicDir, articlesPath } = await makeFixture(rows)

    const summary = await main({ publicDir, articlesPath })
    expect(summary.written).toBe(0)
    expect(summary.missing).toBe(1)
  })
})
