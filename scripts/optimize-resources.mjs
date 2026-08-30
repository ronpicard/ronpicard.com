#!/usr/bin/env node
/**
 * Recompresses mirrored images in public/resources/ in place (same filename and
 * format, so siteArticles.json references and the resource manifest stay valid).
 * PNGs get palette quantization, JPEGs get mozjpeg; a file is only rewritten
 * when the result is meaningfully smaller. Idempotent — run after sync/mirror.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, extname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const RESOURCES_DIR = join(__dirname, '..', 'public/resources')

/** Skip rewrites that save less than this fraction — not worth the churn. */
const MIN_SAVINGS = 0.1
const PNG_QUALITY = 85
const JPEG_QUALITY = 80

async function compress(file, ext) {
  const input = readFileSync(file)
  const image = sharp(input)
  if (ext === '.png') {
    return { input, output: await image.png({ palette: true, quality: PNG_QUALITY, compressionLevel: 9 }).toBuffer() }
  }
  return { input, output: await image.jpeg({ mozjpeg: true, quality: JPEG_QUALITY }).toBuffer() }
}

export async function main() {
  const names = readdirSync(RESOURCES_DIR).filter((n) => /\.(png|jpe?g)$/i.test(n))
  let beforeTotal = 0
  let afterTotal = 0
  let rewritten = 0

  for (const name of names) {
    const file = join(RESOURCES_DIR, name)
    const ext = extname(name).toLowerCase() === '.png' ? '.png' : '.jpg'
    const before = statSync(file).size
    beforeTotal += before
    let output
    try {
      ;({ output } = await compress(file, ext))
    } catch (error) {
      console.warn(`  skip (unreadable): ${name}\n    ${error.message}`)
      afterTotal += before
      continue
    }
    if (output.length <= before * (1 - MIN_SAVINGS)) {
      writeFileSync(file, output)
      rewritten++
      afterTotal += output.length
      console.log(
        `  ${name}: ${(before / 1024).toFixed(0)}K → ${(output.length / 1024).toFixed(0)}K`,
      )
    } else {
      afterTotal += before
    }
  }

  console.log(
    `optimize-resources: ${rewritten}/${names.length} images rewritten, ` +
      `${(beforeTotal / 1024 / 1024).toFixed(1)}M → ${(afterTotal / 1024 / 1024).toFixed(1)}M`,
  )
}

const isMainModule = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMainModule) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
