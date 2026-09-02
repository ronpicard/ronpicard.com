# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Changed

- The ClamAV Control post now describes the current Tauri 2 + Rust desktop app instead of the retired Electron build, and its repo link and live README point at the renamed `clamav-antivirus-ui` repository; its card image is a fresh v2.2.0 Status screen screenshot.

### Added

- Posts whose GitHub repo publishes releases show a Releases button next to Code, on the home card and the article page, linking to the latest release. Set `releasesUrl` in `src/data/siteArticles.json` to enable it; the ClamAV Control post is the first.
- Pages ship prerendered content: the homepage card grid and article pages are rendered into the HTML at build time and hydrated in the browser, removing the blank-page delay on first visit.
- The homepage card grid loads card-sized WebP thumbnails (~768px) instead of full-resolution title images, cutting its image weight from roughly 14 MB to about 2 MB; the first row of cards loads eagerly at high priority with preload hints.

- Offline fallback for dynamic README posts: the build snapshots each referenced GitHub README (`npm run mirror:readmes`), and article pages render the snapshot when GitHub is unreachable.
- Link previews on social platforms now include per-article image dimensions and alt text (`og:image:width`/`height`/`alt`, `twitter:image:alt`), so cards render on the first share.
- `npm run optimize:resources` recompresses mirrored images in place.

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

- Fonts (Orbitron, Rajdhani) are self-hosted from `public/fonts/` instead of loading from Google Fonts, removing a render-blocking third-party request.
- Mirrored images recompressed in place, cutting total image weight from about 32 MB to 21 MB for faster page loads.
- Blog canonical URLs, `og:url`, and sitemap entries use the trailing-slash form GitHub Pages redirects to, so crawlers and scrapers skip a redirect hop.
- The expanded demo Full view is now a modal dialog: Tab focus stays inside the overlay and Escape returns focus to the toggle.
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

- External links in article bodies and dynamic READMEs render correctly again: the sanitizer's anchor hardening dropped the tag's closing bracket, so link text was parsed as attributes and following content was swallowed into the link (visible as many consecutive elements sharing one URL, e.g. in the AGI essay).
- Focusing the search field on iPhones no longer zooms the page (input font size raised to the 16px iOS Safari threshold).
- On touch devices, inline demo embeds start behind a "Tap to interact" guard so swiping over them scrolls the page instead of the embedded app; tapping the guard (or Full view) enables interaction.
- Full view locks background scrolling reliably on iOS Safari by fixing the body in place, restoring the scroll position on exit.
- Footer links have a larger touch target without any visual layout change.
- Site title and descriptions read "My projects involving…" instead of "My project involving…" in the browser tab, search results, and social cards.
- Article navigation starts at the top, while Browser Back restores the prior home catalog position without a visible scroll animation.
- Search matches titles and summaries after collapsing extra whitespace, so a query like `neural   networks` finds `Neural  Networks`.

### Removed

- Obsolete `meta keywords` tag from the page head.
- Stray root `vite` dev-server log file; unused re-exports and internal-only exports tightened.
- Superseded manual `gh-pages` deployment scripts and dependency; GitHub Actions is the single deployment path.

### Security

- Content-Security-Policy no longer allows Google Fonts hosts; fonts and stylesheets load only from the site's own origin.
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
