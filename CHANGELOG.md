# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- `EmbedFrame` with a Full view / Exit full view control for GitHub Pages demo embeds on article pages.
- Vitest unit tests for routing, HTML sanitization, URL validation, CSP/slug guards, and GitHub raw URL helpers (`npm test`).
- Expanded unit coverage for article catalog helpers, README fetch/render, search query normalization, asset URLs, and display labels.
- Playwright e2e smoke tests for home navigation, search, slug redirects, demo links, and dynamic README success/error paths (`npm run test:e2e`).
- Vitest coverage via `@vitest/coverage-v8` and `npm run test:coverage` (~95% statements / ~97% lines on tested modules).
- GitHub Actions workflow (`.github/workflows/deploy.yml`) runs unit tests and deploys to GitHub Pages on push to `main`.
- Dynamic README loading for blog posts that set `readmeRawUrl` in `siteArticles.json` (client fetch from `raw.githubusercontent.com` with loading UI).
- Shared TypeScript modules under `shared/` used by the app and build scripts (`articleHtmlSanitize`, `siteArticlesRouting`, `githubRawContentUrls`, `htmlEscape`).
- ClamAV Control project entry with dashboard image under `public/resources/`.
- Prerendered sitemap, robots directives, JSON-LD metadata, and a noindex 404 page.
- Keyboard-accessible skip navigation and search combobox behavior.
- Playwright end-to-end checks in the deployment workflow, weekly Dependabot updates, a custom favicon, and a pinned Node.js 22 runtime.

### Changed

- Phone and tablet layouts give demo embeds a taller usable frame, larger touch targets, safer page padding, and a Full view control for near-fullscreen interaction.
- Search normalize/match helpers extracted to `src/lib/siteSearchQuery.ts` for unit testing.
- README and REQUIREMENTS document test commands, coverage scope, and current coverage levels.
- Production Content-Security-Policy `connect-src` allows GitHub raw content and API hosts so in-browser README fetch works on GitHub Pages.
- Article HTML sanitization and slug/route logic consolidated into `shared/` to avoid duplication between `src/` and `scripts/`.
- Further deduplication: `shared/hrefKey`, `shared/githubRepo`, `shared/siteMeta`, `shared/urlSchemes`, `buildArticleRouteSlugs`, `scripts/lib/fetchText.mjs`; UI helpers in `src/lib/articleDisplay.ts` and `YoutubeIcon`.
- `merge-blog-post.mjs` now uses the same article sort order as the app (`sortIndexedArticles`).
- Article HTML bodies load from route-specific static files instead of the home-page JavaScript bundle.
- Project cards are fully clickable without nested interactive controls, and article pages use a responsive standard-width layout with primary actions grouped above the content.
- Unit coverage now enforces minimum thresholds of 94% statements, 85% branches, 98% functions, and 97% lines.
- Article JSON now passes a shared runtime schema, and external consumers use the articles feature public entry point.
- CI now enforces coverage thresholds; local and CI runtimes are aligned on Node.js 22.23.2.

### Fixed

- Article navigation starts at the top, while Browser Back restores the prior home catalog position without a visible scroll animation.
- Search matches titles and summaries after collapsing extra whitespace, so a query like `neural   networks` finds `Neural  Networks`.

### Removed

- Stray root `vite` dev-server log file; unused re-exports and internal-only exports tightened.
- Superseded manual `gh-pages` deployment scripts and dependency; GitHub Actions is the single deployment path.

### Security

- Stricter validation for outbound links, embeds, GitHub raw README URLs, and public blog slugs (`src/lib/safeUrls.ts`, `src/config/security.ts`).
- Article and README HTML sanitized with DOMPurify rules in `shared/articleHtmlSanitize.ts`; external links hardened with `rel="noopener noreferrer"`.
- README fetch capped by size and timeout; requests use `credentials: 'omit'` and `referrerPolicy: 'no-referrer'`.
- Production CSP, COOP, and referrer policy injected at build time via `vite.config.ts`; optional `public/_headers` for Cloudflare-style hosts.
- Build-time asset fetches now enforce exact hosts, manually validated redirects, response limits, passive file signatures, and SVG rejection.
- Browser asset and article-link resolution now rejects unapproved hosts, protocol-relative URLs, and traversal paths.

## [1.0.0] - 2026-05-24

### Added

- Initial Vite + React portfolio and blog replacing the Squarespace-hosted site.
- GitHub Pages deploy to custom domain `ronpicard.com` with post-build prerender for SEO meta tags.
