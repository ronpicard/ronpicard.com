#!/usr/bin/env node
/**
 * Writes card-sized WebP thumbnails for article title images into
 * public/resources/thumbs/ (sources in public/resources/ stay untouched; the
 * homepage card grid loads the thumbs via resolveThumbAssetUrl). Idempotent —
 * an existing thumbnail is only rewritten when its source is newer.
 */
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import sharp from 'sharp'
import { resourceThumbPath, THUMB_QUALITY, THUMB_WIDTH } from '../shared/resourceThumbs.ts'
import { parseSiteArticleRows } from '../shared/siteArticleSchema.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DEFAULT_PUBLIC_DIR = join(__dirname, '..', 'public')
const DEFAULT_ARTICLES_PATH = join(__dirname, '..', 'src/data/siteArticles.json')

export async function main({
  publicDir = DEFAULT_PUBLIC_DIR,
  articlesPath = DEFAULT_ARTICLES_PATH,
} = {}) {
  const rows = parseSiteArticleRows(
    JSON.parse(readFileSync(articlesPath, 'utf8')),
    'generate-thumbs site articles',
  )
  const titleImages = [...new Set(rows.map((row) => row.imageUrl).filter(Boolean))]

  let written = 0
  let skipped = 0
  let missing = 0

  for (const imageRel of titleImages) {
    const thumbRel = resourceThumbPath(imageRel)
    if (!thumbRel) continue // external URL or non-image; the card falls back to the original

    const source = join(publicDir, imageRel)
    if (!existsSync(source)) {
      console.warn(`  missing source: ${imageRel}`)
      missing++
      continue
    }

    const target = join(publicDir, thumbRel)
    if (existsSync(target) && statSync(target).mtimeMs >= statSync(source).mtimeMs) {
      skipped++
      continue
    }

    mkdirSync(dirname(target), { recursive: true })
    await sharp(source)
      .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
      .webp({ quality: THUMB_QUALITY })
      .toFile(target)
    written++
    console.log(
      `  ${thumbRel}: ${(statSync(source).size / 1024).toFixed(0)}K → ${(statSync(target).size / 1024).toFixed(0)}K`,
    )
  }

  console.log(
    `generate-thumbs: ${written} written, ${skipped} up to date, ${missing} missing sources`,
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
