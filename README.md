# ronpicard.com

Static **React** portfolio and blog, built with **Vite** and deployed to **GitHub Pages** on the custom domain [ronpicard.com](https://ronpicard.com/) (`public/CNAME`). The live site replaces the former Squarespace-hosted version.

## Quickstart

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173/`). Routes: `/` (project list), `/blog/:slug` (article).

## What’s in the repo

- **App**: React 19, React Router (history URLs), `react-helmet-async` for per-page `<title>` and Open Graph tags.
- **Content**: `src/data/siteArticles.json` — article metadata, optional HTML body, demo/repo links, embeds, mirrored asset paths, and optional `readmeRawUrl` for live GitHub README rendering.
- **Normalization**: `src/data/articles.ts` sorts entries and builds public `/blog/*` slugs from titles; legacy slugs from an older naming scheme still resolve.
- **Assets**: Files under `public/resources/`; `scripts/resource-manifest.json` tracks the mirror step.
- **Prerender**: `scripts/prerender.mjs` runs after `vite build` and writes static `index.html` files under `dist/` for the home page and each blog post (crawlers and link previews without executing JavaScript).
- **Shared modules**: `shared/` — sanitization, slug/routing (`buildArticleRouteSlugs`), site meta URLs, href dedup keys, GitHub repo parsing, URL scheme guards, raw README URL helpers, and HTML escaping (used by `src/` and `scripts/`).

## Example: blog post with a dynamic README

In `src/data/siteArticles.json`, set `bodyHtml` to `null` and provide a validated raw URL:

```json
{
  "slug": "clamav-antivirus-control-gui",
  "title": "ClamAV Control — Home",
  "readmeRawUrl": "https://raw.githubusercontent.com/ronpicard/clamav-antivirus-control-gui/main/README.md",
  "repoUrl": "https://github.com/ronpicard/clamav-antivirus-control-gui"
}
```

`ArticlePage` renders `DynamicGithubReadme`, which fetches markdown in the browser, converts it with `marked`, and sanitizes HTML before display. Card images and summaries still come from committed JSON and `public/resources/`.

## Configuration

| Item | Location | Notes |
|------|----------|--------|
| Site title, social defaults | `src/config/site.ts` | Branding and default meta |
| Canonical URLs, default SEO copy | `shared/siteMeta.ts` (re-exported in `src/lib/siteMeta.ts`) | Used by React `Seo` and `prerender.mjs` |
| Security limits and CSP | `src/config/security.ts` | Slug rules, README limits, CSP directive list |
| Production base URL | `vite.config.ts` → `prodBase` | `/` for apex domain; `/ronpicard.com/` for project Pages |
| Package homepage (legacy) | `package.json` → `homepage` | Align with `prodBase` if hosting path changes |
| Cloudflare-style headers | `public/_headers` | Not applied on plain GitHub Pages |

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local dev server |
| `npm test` | Run Vitest unit tests once |
| `npm run test:watch` | Vitest in watch mode |
| `npm run build` | Typecheck + Vite → `dist/` (committed JSON + `public/`) |
| `npm run build:full` | Typecheck + mirror assets + Vite + prerender (use before deploy) |
| `npm run preview` | Serve production build locally |
| `npm run deploy` | `build:full` then push `dist/` to `gh-pages` |
| `npm run sync:articles` | Scrape/update `siteArticles.json` from legacy Squarespace |
| `npm run mirror:resources` | Fetch assets into `public/resources/` |
| `npm run merge:blog-post` | Merge one post from Squarespace (see `scripts/merge-blog-post.mjs`) |

`build:full` may rewrite `siteArticles.json` and fetch files — commit intentional changes after it runs.

## Tests

Unit tests use [Vitest](https://vitest.dev/) (`vitest.config.ts`). They cover security and routing logic that must stay consistent between the app and build scripts:

- `shared/siteArticlesRouting.test.ts` — slugs, sort order, legacy titles
- `shared/articleHtmlSanitize.test.ts` — DOMPurify rules and link hardening
- `shared/githubRawContentUrls.test.ts` — raw GitHub URL → blob/viewer URLs
- `shared/htmlEscape.test.ts` — CSP meta escaping
- `shared/hrefKey.test.ts`, `shared/githubRepo.test.ts` — link dedup and repo URL parsing
- `src/lib/safeUrls.test.ts` — outbound URL and embed validation
- `src/config/security.test.ts` — CSP string and public slug guards
- `src/lib/sanitizeArticleHtml.test.ts` — article body pipeline

Run before deploy or when changing `shared/`, `safeUrls`, or security config:

```bash
npm test
```

## Refreshing content from the legacy Squarespace site

While that site is still the source of truth for scraping:

```bash
npm run sync:articles
npm run mirror:resources
```

Then commit `src/data/siteArticles.json`, `public/resources/`, and `scripts/resource-manifest.json` as needed.

To merge a single new post without a full sync:

```bash
npm run merge:blog-post
```

See `scripts/merge-blog-post.mjs` for usage.

## Deploy

```bash
npm run deploy
```

This runs `predeploy` → `build:full`, then pushes `dist/` to the `gh-pages` branch via [gh-pages](https://github.com/tschaub/gh-pages).

**GitHub Pages**: Repository **Settings → Pages** — deploy from branch **gh-pages**, folder **/** (root). Set the custom domain to **ronpicard.com** and use the DNS settings GitHub documents.

**Git push**: Use the GitHub account that owns the repo (`gh auth switch` if `gh` is logged in as another user).

## URLs

On the custom domain, posts use normal path URLs, for example:

`https://ronpicard.com/blog/sorting-algorithms-visualizer`

Not hash-based routing (`#/blog/...`).

## Security

The site is static: no app server or database in this repo.

- **CSP**: Production `index.html` gets a Content-Security-Policy from `src/config/security.ts` (injected in `vite.config.ts`). `connect-src` includes GitHub raw/API hosts for dynamic README fetch.
- **Sanitization**: Stored and fetched HTML goes through `shared/articleHtmlSanitize.ts`; README markdown is converted then sanitized in `src/lib/githubReadme.ts`.
- **URL validation**: `src/lib/safeUrls.ts` gates demo, repo, embed, readme, and link fields from JSON.
- **Slugs**: Route params are checked with `isSafePublicSlug()` in `src/config/security.ts`.
- **Dependencies**: Run `npm audit` and address issues before deploys.

See [REQUIREMENTS.md](REQUIREMENTS.md) for full constraints and [CHANGELOG.md](CHANGELOG.md) for release notes.

## Contributing and license

This is a personal portfolio repository. For change history, see [CHANGELOG.md](CHANGELOG.md). Licensed under the [MIT License](LICENSE) — Copyright (c) 2026 Ron Picard.
