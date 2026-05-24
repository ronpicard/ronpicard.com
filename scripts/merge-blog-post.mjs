#!/usr/bin/env node
/**
 * Fetch one blog URL (when Squarespace sitemap lags) and merge into siteArticles.json.
 * Usage: node scripts/merge-blog-post.mjs 'https://www.ronpicard.com/blog/your-slug'
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { sortIndexedArticles } from '../shared/siteArticlesRouting.ts'
import { fetchText } from './lib/fetchText.mjs'
import { parsePost } from './fetch-site-articles.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '../src/data/siteArticles.json')

async function main() {
  const url = process.argv[2]?.replace(/\/$/, '')
  if (!url || !url.includes('ronpicard.com/blog/')) {
    console.error('Usage: node scripts/merge-blog-post.mjs https://www.ronpicard.com/blog/slug')
    process.exit(1)
  }
  const html = await fetchText(url)
  const row = parsePost(url, html)
  const arr = JSON.parse(readFileSync(OUT, 'utf8'))
  const i = arr.findIndex((r) => r.slug === row.slug)
  if (i >= 0) arr[i] = row
  else arr.push(row)
  const indexed = arr.map((row, sourceIndex) => ({ row, sourceIndex }))
  const sorted = sortIndexedArticles(indexed).map((x) => x.row)
  writeFileSync(OUT, JSON.stringify(sorted, null, 2))
  console.error(i >= 0 ? 'updated' : 'added', row.slug, OUT)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
