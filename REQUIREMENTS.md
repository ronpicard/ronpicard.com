# Requirements

Functional and security constraints for **ronpicard.com**. Update this file when behavior or acceptance criteria change.

## Requirements

### Site and deployment

- The site MUST be a static SPA (HTML/CSS/JS only); this repo MUST NOT require an application server or database at runtime.
- Production MUST be deployable to GitHub Pages with custom domain `ronpicard.com` (`public/CNAME`, `npm run deploy` → `gh-pages` branch).
- Production asset base URL MUST be `/` for the apex domain; project Pages hosting MUST be supported by changing `prodBase` in `vite.config.ts` and `homepage` in `package.json`.
- Blog routes MUST use history URLs (`/blog/:slug`), not hash routing.

### Content and routing

- Article metadata MUST live in `src/data/siteArticles.json` and be normalized in `src/data/articles.ts`.
- Public blog slugs MUST be derived from post titles (not legacy storage slugs); legacy slugs from the pre–Mar 2026 naming scheme MUST still resolve for bookmarks and prerendered paths.
- Mirrored assets MUST live under `public/resources/` and be referenced as `resources/...` in JSON, resolved with the Vite base URL at render time.
- After `vite build`, prerender MUST emit static `index.html` per home and blog route with real `<title>` and Open Graph tags.

### Dynamic GitHub README posts

- Posts MAY set `readmeRawUrl` (validated `https://raw.githubusercontent.com/...` URL) instead of inlined `bodyHtml`.
- The client MUST fetch README markdown at view time, show a loading state, and render sanitized HTML on success.
- On fetch or sanitize failure, the UI MUST show the article summary and a safe link to view the README on GitHub.
- README fetch MUST enforce a timeout (12s), a maximum body size (512 KiB), `credentials: 'omit'`, and `referrerPolicy: 'no-referrer'`.

### Security

- All HTML rendered from JSON or fetched READMEs MUST pass through `shared/articleHtmlSanitize.ts` (DOMPurify allowlists, forbidden tags/attrs, external link hardening).
- URLs from JSON (demo, repo, embed, readme, extra links) MUST be validated in `src/lib/safeUrls.ts` before use in the DOM; dangerous schemes (`javascript:`, `data:`, etc.) MUST be rejected.
- Blog `:slug` route params MUST pass `isSafePublicSlug()` before loading an article.
- Search input MUST be bounded (`SEARCH_QUERY_MAX_LEN`).
- Production HTML MUST include a Content-Security-Policy that allows only required third-party hosts (YouTube nocookie embeds, `ronpicard.github.io` frames, Google Fonts, GitHub raw/API for README fetch).
- YouTube embeds MUST use validated video IDs and the nocookie embed host where applicable.

### Shared code and tooling

- Logic shared between the app and Node scripts MUST live under `shared/` and be importable from both (`tsconfig.json` includes `shared/`).
- Build and ingest scripts MUST reuse the same sanitization and routing rules as the app where they touch HTML or slugs.
- Security-sensitive helpers (sanitization, slug rules, GitHub URL parsing) SHOULD have unit tests; run `npm test` before release-worthy changes.

### Content maintenance (optional workflows)

- While Squarespace remains a source, `npm run sync:articles` and `npm run mirror:resources` MAY refresh JSON and `public/resources/`; resulting files SHOULD be committed intentionally.
- Single-post merges MAY use `npm run merge:blog-post` per `scripts/merge-blog-post.mjs`.

## Non-goals

- Server-side rendering or API routes in this repo.
- Storing secrets or private tokens in the client bundle.
- Relying on `public/_headers` on plain GitHub Pages (only effective when a host serves that file, e.g. Cloudflare).
