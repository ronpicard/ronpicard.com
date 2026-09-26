#!/usr/bin/env node
/**
 * Writes a 1200×630 Open Graph card for each post's share image into
 * public/resources/og/ (sources in public/resources/ stay untouched; prerender
 * points og:image at the card). Wide images are cover-cropped; portrait,
 * square and small images are shown whole over a blurred, dimmed copy of
 * themselves so link previews never cut off the subject. Idempotent — an
 * existing card is only rewritten when its source is newer.
 */
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import sharp from 'sharp'
import {
  OG_HEIGHT,
  OG_QUALITY,
  OG_WIDTH,
  postShareImage,
  resourceOgPath,
} from '../shared/resourceOgImages.ts'
import { parseSiteArticleRows } from '../shared/siteArticleSchema.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DEFAULT_PUBLIC_DIR = join(__dirname, '..', 'public')
const DEFAULT_ARTICLES_PATH = join(__dirname, '..', 'src/data/siteArticles.json')

/** Aspect ratios this close to 1.91:1 lose little to a cover crop (16:9 included). */
const COVER_MIN_RATIO = 1.6
const COVER_MAX_RATIO = 2.2

/** Card bytes for one source image. */
export async function renderOgCard(source) {
  const { width = 0, height = 0 } = await sharp(source).metadata()
  const ratio = width / height
  const fitsCover =
    ratio >= COVER_MIN_RATIO &&
    ratio <= COVER_MAX_RATIO &&
    width >= OG_WIDTH / 2 &&
    height >= OG_HEIGHT / 2

  if (fitsCover) {
    return sharp(source)
      .resize(OG_WIDTH, OG_HEIGHT, { fit: 'cover' })
      .flatten({ background: '#000' })
      .jpeg({ quality: OG_QUALITY, mozjpeg: true })
      .toBuffer()
  }

  const backdrop = await sharp(source)
    .resize(OG_WIDTH, OG_HEIGHT, { fit: 'cover' })
    .flatten({ background: '#000' })
    .blur(40)
    .modulate({ brightness: 0.45 })
    .toBuffer()
  const foreground = await sharp(source)
    .resize(OG_WIDTH, OG_HEIGHT, { fit: 'inside' })
    .png()
    .toBuffer()
  return sharp(backdrop)
    .composite([{ input: foreground, gravity: 'center' }])
    .jpeg({ quality: OG_QUALITY, mozjpeg: true })
    .toBuffer()
}

export async function main({
  publicDir = DEFAULT_PUBLIC_DIR,
  articlesPath = DEFAULT_ARTICLES_PATH,
} = {}) {
  const rows = parseSiteArticleRows(
    JSON.parse(readFileSync(articlesPath, 'utf8')),
    'generate-og-images site articles',
  )
  const shareImages = [...new Set(rows.map(postShareImage).filter(Boolean))]

  let written = 0
  let skipped = 0
  let missing = 0

  for (const imageRel of shareImages) {
    const cardRel = resourceOgPath(imageRel)
    if (!cardRel) continue // external URL or non-image; the post shares the original

    const source = join(publicDir, imageRel)
    if (!existsSync(source)) {
      console.warn(`  missing source: ${imageRel}`)
      missing++
      continue
    }

    const target = join(publicDir, cardRel)
    if (existsSync(target) && statSync(target).mtimeMs >= statSync(source).mtimeMs) {
      skipped++
      continue
    }

    mkdirSync(dirname(target), { recursive: true })
    await sharp(await renderOgCard(source)).toFile(target)
    written++
    console.log(`  ${cardRel}: ${(statSync(target).size / 1024).toFixed(0)}K`)
  }

  console.log(
    `generate-og-images: ${written} written, ${skipped} up to date, ${missing} missing sources`,
  )
  return { written, skipped, missing }
}

const isMainModule = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMainModule) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
