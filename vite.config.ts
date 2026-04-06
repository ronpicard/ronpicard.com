import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Custom domain (apex) production: https://ronpicard.com/
// If you switch back to GitHub project pages (https://ronpicard.github.io/ronpicard.com/),
// set prodBase to '/ronpicard.com/'.
const prodBase = '/'

/** Production-only CSP: keeps Vite dev (HMR, eval) working locally. */
const PRODUCTION_CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "frame-src https://www.youtube-nocookie.com https://ronpicard.github.io",
  "img-src 'self' data: https:",
  "font-src 'self' https://fonts.gstatic.com data:",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "script-src 'self'",
  "connect-src 'self'",
  "upgrade-insecure-requests",
].join('; ')

export default defineConfig(({ command }) => {
  const base = command === 'serve' ? '/' : prodBase

  return {
    base,
    plugins: [
      react(),
      {
        name: 'prod-csp',
        transformIndexHtml(html, ctx) {
          let out = html
        if (!ctx.server) {
          out = out.replace(
            '<meta charset="UTF-8" />',
            `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${PRODUCTION_CSP}" />`,
          )
        }
        return out
      },
    },
  ],
  }
})
