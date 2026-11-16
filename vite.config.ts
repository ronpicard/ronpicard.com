import { defineConfig } from 'vite'
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { buildSearchIndex, SEARCH_INDEX_FILE } from './shared/searchIndex.ts'
import { escapeHtmlAttr } from './shared/htmlEscape.ts'
import { buildProductionCsp, PRODUCTION_SECURITY_METAS } from './src/config/security.ts'

// Custom domain (apex) production: https://ronpicard.com/
// If you switch back to GitHub project pages (https://ronpicard.github.io/ronpicard.com/),
// set prodBase to '/ronpicard.com/'.
const prodBase = '/'

function productionSecurityMetaTags(): string {
  const csp = `<meta http-equiv="Content-Security-Policy" content="${escapeHtmlAttr(buildProductionCsp())}" />`
  const rest = PRODUCTION_SECURITY_METAS.map((m) => {
    if (m.httpEquiv) {
      return `<meta http-equiv="${escapeHtmlAttr(m.httpEquiv)}" content="${escapeHtmlAttr(m.content)}" />`
    }
    return `<meta name="${escapeHtmlAttr(m.name ?? '')}" content="${escapeHtmlAttr(m.content)}" />`
  }).join('\n    ')
  return `${csp}\n    ${rest}`
}

/** Serves (dev) or emits (build) the full-text search index built from public/article-bodies/. */
function searchIndexPlugin(): Plugin {
  const bodiesDir = path.resolve(import.meta.dirname, 'public/article-bodies')
  const build = () => {
    const bodies: Record<string, string> = {}
    for (const name of readdirSync(bodiesDir)) {
      if (name.endsWith('.html')) bodies[`article-bodies/${name}`] = readFileSync(path.join(bodiesDir, name), 'utf8')
    }
    return buildSearchIndex(bodies)
  }
  return {
    name: 'article-search-index',
    configureServer(server) {
      server.middlewares.use(`/${SEARCH_INDEX_FILE}`, (_req, res) => {
        res.setHeader('Content-Type', 'application/json')
        res.end(build())
      })
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: SEARCH_INDEX_FILE, source: build() })
    },
  }
}

export default defineConfig(({ command, isSsrBuild }) => {
  const base = command === 'serve' ? '/' : prodBase

  return {
    base,
    build: {
      // The SSR bundle (dist-server) is build-time only; don't copy public/.
      copyPublicDir: !isSsrBuild,
    },
    plugins: [
      react(),
      ...(isSsrBuild ? [] : [searchIndexPlugin()]),
      {
        name: 'prod-security-headers',
        transformIndexHtml(html, ctx) {
          if (ctx.server) return html
          return html.replace(
            '<meta charset="UTF-8" />',
            `<meta charset="UTF-8" />\n    ${productionSecurityMetaTags()}`,
          )
        },
      },
    ],
  }
})
