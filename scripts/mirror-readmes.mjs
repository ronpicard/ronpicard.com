#!/usr/bin/env node
/**
 * Snapshots GitHub READMEs referenced by siteArticles.json rows (readmeRawUrl)
 * into public/readme-snapshots/<slug>.md. The article page fetches the live
 * README first and falls back to the snapshot when GitHub is unreachable.
 * Fetch failures keep any existing snapshot and never fail the build.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { parseRawGithubContentUrl } from '../shared/githubRawContentUrls.ts'
import { parseSiteArticleRows } from '../shared/siteArticleSchema.ts'
import { isSafePublicSlug, README_MAX_BYTES } from '../src/config/security.ts'
import { fetchText, requireAllowedHttpsUrl } from './lib/fetchText.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const ARTICLES_JSON = join(ROOT, 'src/data/siteArticles.json')
const OUT_DIR = join(ROOT, 'public/readme-snapshots')

const FETCH_TIMEOUT_MS = 20_000

export async function main() {
  mkdirSync(OUT_DIR, { recursive: true })
  const rows = parseSiteArticleRows(JSON.parse(readFileSync(ARTICLES_JSON, 'utf8')), ARTICLES_JSON)

  const wanted = new Map()
  for (const row of rows) {
    const rawUrl = row.readmeRawUrl?.trim()
    if (!rawUrl || !isSafePublicSlug(row.slug)) continue
    const parsed = parseRawGithubContentUrl(rawUrl)
    if (!parsed) {
      console.warn(`mirror-readmes: skip invalid raw URL for ${row.slug}: ${rawUrl}`)
      continue
    }
    wanted.set(row.slug, parsed.rawUrl)
  }

  console.log(`mirror-readmes: ${wanted.size} README(s) to snapshot`)

  for (const [slug, rawUrl] of wanted) {
    const outFile = join(OUT_DIR, `${slug}.md`)
    try {
      const text = await fetchText(rawUrl, {
        headers: {
          'user-agent': 'ronpicard.com-mirror-readmes/1.0',
          accept: 'text/plain, text/markdown, text/*',
        },
        maxBytes: README_MAX_BYTES,
        timeoutMs: FETCH_TIMEOUT_MS,
        validateUrl: (url) =>
          requireAllowedHttpsUrl(url, new Set(['raw.githubusercontent.com'])),
      })
      writeFileSync(outFile, text, 'utf8')
      console.log(`  wrote readme-snapshots/${slug}.md (${text.length} chars)`)
    } catch (error) {
      const kept = existsSync(outFile) ? '; keeping existing snapshot' : ''
      console.warn(`  skip (fetch failed${kept}): ${slug}\n    ${error.message}`)
    }
  }

  for (const name of readdirSync(OUT_DIR)) {
    if (name.endsWith('.md') && !wanted.has(name.slice(0, -3))) {
      unlinkSync(join(OUT_DIR, name))
      console.log(`  removed stale readme-snapshots/${name}`)
    }
  }
}

const isMainModule = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMainModule) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}
