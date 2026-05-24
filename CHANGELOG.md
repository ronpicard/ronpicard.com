# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Vitest unit tests for routing, HTML sanitization, URL validation, CSP/slug guards, and GitHub raw URL helpers (`npm test`).
- Dynamic README loading for blog posts that set `readmeRawUrl` in `siteArticles.json` (client fetch from `raw.githubusercontent.com` with loading UI).
- Shared TypeScript modules under `shared/` used by the app and build scripts (`articleHtmlSanitize`, `siteArticlesRouting`, `githubRawContentUrls`, `htmlEscape`).
- ClamAV Control project entry with dashboard image under `public/resources/`.

### Changed

- Production Content-Security-Policy `connect-src` allows GitHub raw content and API hosts so in-browser README fetch works on GitHub Pages.
- Article HTML sanitization and slug/route logic consolidated into `shared/` to avoid duplication between `src/` and `scripts/`.
- Further deduplication: `shared/hrefKey`, `shared/githubRepo`, `shared/siteMeta`, `shared/urlSchemes`, `buildArticleRouteSlugs`, `scripts/lib/fetchText.mjs`; UI helpers in `src/lib/articleDisplay.ts` and `YoutubeIcon`.
- `merge-blog-post.mjs` now uses the same article sort order as the app (`sortIndexedArticles`).

### Removed

- Stray root `vite` dev-server log file; unused re-exports and internal-only exports tightened.

### Security

- Stricter validation for outbound links, embeds, GitHub raw README URLs, and public blog slugs (`src/lib/safeUrls.ts`, `src/config/security.ts`).
- Article and README HTML sanitized with DOMPurify rules in `shared/articleHtmlSanitize.ts`; external links hardened with `rel="noopener noreferrer"`.
- README fetch capped by size and timeout; requests use `credentials: 'omit'` and `referrerPolicy: 'no-referrer'`.
- Production CSP, COOP, and referrer policy injected at build time via `vite.config.ts`; optional `public/_headers` for Cloudflare-style hosts.

## [1.0.0] - 2026-05-24

### Added

- Initial Vite + React portfolio and blog replacing the Squarespace-hosted site.
- GitHub Pages deploy to custom domain `ronpicard.com` with post-build prerender for SEO meta tags.
