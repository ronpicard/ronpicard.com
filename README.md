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
| `npm test` | Run Vitest unit tests once (74 tests) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:coverage` | Vitest with V8 coverage report (`shared/`, `src/lib/`, `src/data/`, `src/config/`) |
| `npm run test:e2e` | Playwright browser smoke tests (8 tests; starts Vite dev server) |
| `npm run test:e2e:ui` | Playwright UI mode |
| `npm run build` | Typecheck + Vite → `dist/` (committed JSON + `public/`) |
| `npm run build:full` | Typecheck + mirror assets + Vite + prerender (use before deploy) |
| `npm run preview` | Serve production build locally |
| `npm run deploy` | `build:full` then push `dist/` to `gh-pages` (manual; CI deploys via GitHub Actions on push to `main`) |
| `npm run sync:articles` | Scrape/update `siteArticles.json` from legacy Squarespace |
| `npm run mirror:resources` | Fetch assets into `public/resources/` |
| `npm run merge:blog-post` | Merge one post from Squarespace (see `scripts/merge-blog-post.mjs`) |

`build:full` may rewrite `siteArticles.json` and fetch files — commit intentional changes after it runs.

## Tests

### Unit (Vitest)

Unit tests use [Vitest](https://vitest.dev/) (`vitest.config.ts`, `@vitest/coverage-v8`). They cover security and routing logic that must stay consistent between the app and build scripts:

| Test file | Focus |
|-----------|--------|
| `shared/siteArticlesRouting.test.ts` | Slugs, sort order, legacy titles |
| `shared/articleHtmlSanitize.test.ts` | DOMPurify rules and link hardening |
| `shared/githubRawContentUrls.test.ts` | Raw GitHub URL → blob/viewer URLs |
| `shared/htmlEscape.test.ts` | CSP meta escaping |
| `shared/hrefKey.test.ts`, `shared/githubRepo.test.ts` | Link dedup and repo URL parsing |
| `src/lib/safeUrls.test.ts` | Outbound URL and embed validation |
| `src/config/security.test.ts` | CSP string and public slug guards |
| `src/lib/sanitizeArticleHtml.test.ts` | Article body pipeline |
| `src/data/articles.test.ts` | Catalog lookup, link filtering, third-party article detection |
| `src/lib/githubReadme.test.ts`, `src/lib/fetchGithubReadme.test.ts` | README markdown render + fetch limits |
| `src/lib/siteSearchQuery.test.ts` | Search normalize/match bounds |
| `src/lib/articleDisplay.test.ts`, `src/lib/assetUrl.test.ts` | Display helpers and asset path resolution |

```bash
npm test
npm run test:coverage   # terminal summary + optional HTML under coverage/
```

**Coverage (unit, logic under test)** — run `npm run test:coverage` after changes to `shared/`, `src/lib/`, `src/data/`, or `src/config/`:

| Metric | Coverage |
|--------|----------|
| Statements | ~84% |
| Branches | ~77% |
| Functions | ~98% |
| Lines | ~91% |

By area (statements): `shared/` ~89%, `src/data/` ~94%, `src/lib/` ~76%. Weakest spots: `fetchGithubReadme.ts`, `safeUrls.ts`, `articleDisplay.ts`.

Coverage counts only modules in `shared/`, `src/lib/`, `src/data/`, and `src/config/` that unit tests import. React pages, components, and build scripts are **not** included; use Playwright for UI smoke coverage.

### End-to-end (Playwright)

Smoke tests use [Playwright](https://playwright.dev/) (`playwright.config.ts`, `e2e/site.spec.ts`):

- Home project list and card → article navigation
- Search filter and Escape to close
- HTML article prose, invalid slug → home, legacy slug → canonical slug
- Demo link host validation
- Dynamic README success (mocked fetch) and error fallback

```bash
npm run test:e2e
npm run test:e2e:ui   # interactive debugger
```

First-time Playwright setup (Chromium):

```bash
npx playwright install chromium
```

Run unit + e2e before deploy or when changing `shared/`, `safeUrls`, security config, or UI routing:

```bash
npm test && npm run test:e2e
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

### Automatic (recommended)

Pushes to **`main`** run [GitHub Actions](.github/workflows/deploy.yml):

1. `npm test` (Vitest unit tests)
2. `npm run build:full`
3. Deploy `dist/` to GitHub Pages

Pull requests to `main` run unit tests only (no deploy).

**One-time setup** (repo owner): **Settings → Pages → Build and deployment → Source** → **GitHub Actions**. Custom domain `ronpicard.com` stays configured via `public/CNAME` (copied into `dist/` on build).

### Manual

```bash
npm run deploy
```

This runs `predeploy` → `build:full`, then pushes `dist/` to the `gh-pages` branch via [gh-pages](https://github.com/tschaub/gh-pages). Use this if Pages is still set to deploy from the `gh-pages` branch instead of GitHub Actions.

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
