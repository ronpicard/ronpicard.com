# ronpicard.com

Static **React** portfolio and blog, built with **Vite** and deployed to **GitHub Pages** with the custom domain **ronpicard.com** (`public/CNAME`). The live site replaces the former Squarespace-hosted version.

## What’s in the repo

- **App**: React 19, React Router (history URLs), `react-helmet-async` for per-page `<title>` and Open Graph tags.
- **Content**: `src/data/siteArticles.json` — article metadata, optional HTML body, demo/repo links, embeds, and mirrored asset paths. Normalized and sorted in `src/data/articles.ts` (public `/blog/*` slugs are derived from titles; legacy slugs from an older naming scheme still resolve and prerender for bookmarks and external links).
- **Assets**: Images, PDFs, and other files pulled from the legacy site live under `public/resources/`; `scripts/resource-manifest.json` tracks what the mirror step has fetched.
- **Prerender**: `scripts/prerender.mjs` runs after `vite build` and writes static `index.html` files under `dist/` for the home page and each blog post so crawlers and link previews get real `<title>` / `og:*` tags without executing JavaScript.

## Local development

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173/`). Routes: `/` (project list), `/blog/:slug` (article).

## Production build

```bash
npm run build        # Typecheck + Vite → dist/ (uses committed JSON + public/)
npm run build:full   # Typecheck + mirror assets + Vite + prerender (use before deploy)
```

`build:full` runs `scripts/mirror-resources.mjs` (may rewrite `siteArticles.json` / fetch files) — commit any intentional changes after it runs.

## Refreshing content from the legacy Squarespace site

While that site is still the source of truth for scraping:

```bash
npm run sync:articles
npm run mirror:resources
```

Then commit `src/data/siteArticles.json`, `public/resources/`, and `scripts/resource-manifest.json` as needed.

To merge a single new post from Squarespace into the JSON without a full sync, use:

```bash
npm run merge:blog-post
```

(See `scripts/merge-blog-post.mjs` for usage.)

## Deploy

```bash
npm run deploy
```

This runs `predeploy` → `build:full`, then pushes `dist/` to the `gh-pages` branch via [gh-pages](https://github.com/tschaub/gh-pages).

**GitHub Pages**: Repository **Settings → Pages** — deploy from branch **gh-pages**, folder **/** (root). Set the custom domain to **ronpicard.com** and use the DNS settings GitHub documents.

**Base URL**: Production is configured for the apex domain with `base: '/'` in `vite.config.ts`. If you ever host under **project** Pages again (`https://ronpicard.github.io/ronpicard.com/`), set `prodBase` in `vite.config.ts` to `'/ronpicard.com/'` and align `homepage` in `package.json`.

## URLs

On the custom domain, posts use normal path URLs, for example:

`https://ronpicard.com/blog/sorting-algorithms-visualizer`

Not hash-based routing (`#/blog/...`).

## Security

The site is static (HTML/CSS/JS only): no app server or database in this repo. External links use `rel="noopener noreferrer"`. Keep dependencies current (`npm audit`) before deploys.
