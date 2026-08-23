# ronpicard.com

Static **React** portfolio and blog, built with **Vite** and deployed to **GitHub Pages** on the custom domain [ronpicard.com](https://ronpicard.com/) (`public/CNAME`). The live site replaces the former Squarespace-hosted version.

## Quickstart

```bash
nvm use
npm install
npm run dev
```

The project uses Node.js 22.23.2. Open the URL Vite prints (usually `http://localhost:5173/`). Routes: `/` (project list), `/blog/:slug` (article).

## What’s in the repo

- **App**: React 19, React Router (history URLs), `react-helmet-async` for per-page `<title>` and Open Graph tags.
- **Content**: `src/data/siteArticles.json` — article metadata, per-article `bodyPath`, demo/repo links, embeds, mirrored asset paths, and optional `readmeRawUrl` for live GitHub README rendering.
- **Articles feature**: `src/features/articles/index.ts` is the public entry point; `src/data/articles.ts` validates and sorts entries and builds public `/blog/*` slugs from titles.
- **Assets**: Files under `public/resources/`; article HTML under `public/article-bodies/`; `scripts/resource-manifest.json` tracks mirrored resources.
- **Prerender**: `scripts/prerender.mjs` writes route HTML with SEO and JSON-LD, plus `sitemap.xml`, `robots.txt`, and a noindex `404.html`.
- **Shared modules**: `shared/` — sanitization, slug/routing (`buildArticleRouteSlugs`), site meta URLs, href dedup keys, GitHub repo parsing, URL scheme guards, raw README URL helpers, and HTML escaping (used by `src/` and `scripts/`).

## Example: blog post with a dynamic README

In `src/data/siteArticles.json`, leave `bodyPath` null and provide a validated raw URL:

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
| Security limits and CSP | `src/config/security.ts` | Slug rules, article/README fetch limits, CSP directive list |
| Production base URL | `vite.config.ts` → `prodBase` | `/` for apex domain; `/ronpicard.com/` for project Pages |
| Package homepage | `package.json` → `homepage` | Align with `prodBase` if hosting path changes |
| Cloudflare-style headers | `public/_headers` | Not applied on plain GitHub Pages |

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local dev server |
| `npm test` | Run Vitest unit tests once (118 tests) |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:coverage` | Vitest with V8 coverage report and enforced thresholds |
| `npm run test:e2e` | Playwright browser smoke tests (13 tests; starts Vite dev server) |
| `npm run test:e2e:ui` | Playwright UI mode |
| `npm run build` | Typecheck + Vite → `dist/` (committed JSON + `public/`) |
| `npm run build:full` | Typecheck + mirror assets + Vite + prerender (use before deploy) |
| `npm run preview` | Serve production build locally |
| `npm run sync:articles` | Scrape/update `siteArticles.json` from legacy Squarespace |
| `npm run mirror:resources` | Fetch assets and extract HTML into `public/article-bodies/` |
| `npm run merge:blog-post` | Merge one post from Squarespace (see `scripts/merge-blog-post.mjs`) |

`build:full` may rewrite `siteArticles.json` and fetch files — commit intentional changes after it runs.

## Tests

### Unit (Vitest)

Unit tests use [Vitest](https://vitest.dev/) (`vitest.config.ts`, `@vitest/coverage-v8`). They cover security and routing logic that must stay consistent between the app and build scripts:

| Test file | Focus |
|-----------|--------|
| `shared/siteArticlesRouting.test.ts`, `shared/siteArticleSchema.test.ts` | Runtime article validation, slugs, sort order, legacy titles |
| `shared/jsonLd.test.ts`, `shared/sitemap.test.ts` | Structured data and crawler files |
| `shared/articleHtmlSanitize.test.ts` | DOMPurify rules and link hardening |
| `shared/githubRawContentUrls.test.ts` | Raw GitHub URL → blob/viewer URLs |
| `shared/htmlEscape.test.ts` | CSP meta escaping |
| `shared/hrefKey.test.ts`, `shared/githubRepo.test.ts` | Link dedup and repo URL parsing |
| `src/lib/safeUrls.test.ts` | Outbound URL and embed validation |
| `src/config/security.test.ts` | CSP string and public slug guards |
| `src/lib/sanitizeArticleHtml.test.ts` | Article body pipeline |
| `src/data/articles.test.ts` | Catalog lookup, link filtering, third-party article detection |
| `src/lib/githubReadme.test.ts`, `src/lib/fetchGithubReadme.test.ts`, `src/lib/fetchArticleBody.test.ts` | Dynamic content rendering + fetch limits |
| `src/lib/siteSearchQuery.test.ts` | Search normalize/match bounds |
| `src/lib/articleDisplay.test.ts`, `src/lib/assetUrl.test.ts` | Display helpers and asset path resolution |
| `src/components/DynamicArticleBody.test.tsx` | Article loading, sanitization, and fallback UI |
| `scripts/lib/fetchText.test.mjs`, `scripts/mirror-resources.test.mjs` | Bounded fetches, redirect/host controls, and passive asset signatures |
| `scripts/prerender.test.mjs` | Route metadata, sitemap, robots, and 404 output |

```bash
npm test
npm run test:coverage   # terminal summary + optional HTML under coverage/
```

**Coverage (unit, logic under test)** — run `npm run test:coverage` after changes to `shared/`, `src/lib/`, `src/data/`, or `src/config/`:

| Metric | Coverage |
|--------|----------|
| Statements | ~95% |
| Branches | ~89% |
| Functions | ~98% |
| Lines | ~97% |

Coverage thresholds prevent regressions below 94% statements, 85% branches, 98% functions, or 97% lines.

Coverage includes imported shared logic, runtime libraries, article data, tested components, and build-script helpers. React pages remain covered by Playwright user-journey checks.

### End-to-end (Playwright)

Smoke tests use [Playwright](https://playwright.dev/) (`playwright.config.ts`, `e2e/site.spec.ts`):

- Home project list and card → article navigation
- Search combobox Arrow/Enter navigation and Escape to close
- Keyboard skip link
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

Run coverage + e2e before deploy or when changing `shared/`, URL validation, security config, or UI routing:

```bash
npm run test:coverage && npm run test:e2e
```

## Refreshing content from the legacy Squarespace site

While that site is still the source of truth for scraping:

```bash
npm run sync:articles
npm run mirror:resources
```

Then commit `src/data/siteArticles.json`, `public/article-bodies/`, `public/resources/`, and `scripts/resource-manifest.json` as needed.

To merge a single new post without a full sync:

```bash
npm run merge:blog-post
```

See `scripts/merge-blog-post.mjs` for usage.

## Deploy

### Automatic (recommended)

Pushes to **`main`** run [GitHub Actions](.github/workflows/deploy.yml):

1. `npm run test:coverage` and `npm run test:e2e`
2. `npm run build:full`
3. Deploy `dist/` to GitHub Pages

Pull requests to `main` run unit and browser tests (no deploy).

**One-time setup** (repo owner): **Settings → Pages → Build and deployment → Source** → **GitHub Actions**. Custom domain `ronpicard.com` stays configured via `public/CNAME` (copied into `dist/` on build).

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
- **Content ingestion**: Build scripts enforce exact source hosts, manually validate redirects, cap response sizes, and reject active SVG content before publication.
- **Slugs**: Route params are checked with `isSafePublicSlug()` in `src/config/security.ts`.
- **Dependencies**: Run `npm audit` and address issues before deploys.

See [REQUIREMENTS.md](REQUIREMENTS.md) for full constraints and [CHANGELOG.md](CHANGELOG.md) for release notes.

## Contributing and license

This is a personal portfolio repository. For change history, see [CHANGELOG.md](CHANGELOG.md). Licensed under the [MIT License](LICENSE) — Copyright (c) 2026 Ron Picard.
