#!/usr/bin/env node
/**
 * Writes responsive WebP variants (shared/resourceSized.ts widths) of article
 * images into public/resources/sized/. Sources: each article's page picture
 * (articleHeroUrl ?? imageUrl) and every local raster <img> in
 * public/article-bodies/*.html. Idempotent by mtime; missing sources warn.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import sharp from 'sharp'
import { postShareImage } from '../shared/resourceOgImages.ts'
import { resourceSizedPath, SIZED_QUALITY, SIZED_WIDTHS } from '../shared/resourceSized.ts'
import { parseSiteArticleRows } from '../shared/siteArticleSchema.ts'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DEFAULT_PUBLIC_DIR = join(__dirname, '..', 'public')
const DEFAULT_ARTICLES_PATH = join(__dirname, '..', 'src/data/siteArticles.json')
const IMG_SRC_RE = /<img\b[^>]*?\bsrc="(resources\/[^"]+)"/gi

export async function main({
  publicDir = DEFAULT_PUBLIC_DIR,
  articlesPath = DEFAULT_ARTICLES_PATH,
} = {}) {
  const rows = parseSiteArticleRows(
    JSON.parse(readFileSync(articlesPath, 'utf8')),
    'generate-sized site articles',
  )
  const sources = new Set(rows.map(postShareImage).filter(Boolean))

  const bodiesDir = join(publicDir, 'article-bodies')
  if (existsSync(bodiesDir)) {
    for (const file of readdirSync(bodiesDir).filter((f) => f.endsWith('.html'))) {
      const html = readFileSync(join(bodiesDir, file), 'utf8')
      for (const match of html.matchAll(IMG_SRC_RE)) sources.add(match[1])
    }
  }

  let written = 0
  let skipped = 0
  let missing = 0
  let sourceBytes = 0
  let sizedBytes1280 = 0

  for (const rel of [...sources].filter((s) => resourceSizedPath(s, SIZED_WIDTHS[0]))) {
    const source = join(publicDir, rel)
    if (!existsSync(source)) {
      console.warn(`  missing source: ${rel}`)
      missing++
      continue
    }
    const sourceStat = statSync(source)
    sourceBytes += sourceStat.size

    for (const width of SIZED_WIDTHS) {
      const target = join(publicDir, resourceSizedPath(rel, width))
      if (!(existsSync(target) && statSync(target).mtimeMs >= sourceStat.mtimeMs)) {
        mkdirSync(dirname(target), { recursive: true })
        await sharp(source)
          .resize({ width, withoutEnlargement: true })
          .webp({ quality: SIZED_QUALITY })
          .toFile(target)
        written++
        console.log(
          `  ${rel} @${width}: ${(sourceStat.size / 1024).toFixed(0)}K → ${(statSync(target).size / 1024).toFixed(0)}K`,
        )
      } else {
        skipped++
      }
      if (width === 1280) sizedBytes1280 += statSync(target).size
    }
  }

  console.log(
    `generate-sized: ${written} written, ${skipped} up to date, ${missing} missing sources (sources ${sourceBytes} B, 1280 variants ${sizedBytes1280} B)`,
  )
  return { written, skipped, missing, sourceBytes, sizedBytes1280 }
}

const isMainModule = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMainModule) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
