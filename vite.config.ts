import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { escapeHtmlAttr } from './shared/htmlEscape'
import { buildProductionCsp, PRODUCTION_SECURITY_METAS } from './src/config/security'

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

export default defineConfig(({ command }) => {
  const base = command === 'serve' ? '/' : prodBase

  return {
    base,
    plugins: [
      react(),
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
