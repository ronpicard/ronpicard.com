import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub project page: https://ronpicard.github.io/ronpicard.com/
// If you use a custom domain (e.g. ronpicard.com) with this repo, set base to '/'.
const base = '/ronpicard.com/'

export default defineConfig({
  base,
  plugins: [
    react(),
    {
      name: 'favicon-base',
      transformIndexHtml(html) {
        return html.replace(/href="favicon\.svg"/, `href="${base}favicon.svg"`)
      },
    },
  ],
})
