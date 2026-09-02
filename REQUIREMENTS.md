# Requirements

Functional and security constraints for **ronpicard.com**. Update this file when behavior or acceptance criteria change.

## Requirements

### Site and deployment

- The site MUST be a static SPA (HTML/CSS/JS only); this repo MUST NOT require an application server or database at runtime.
- Production MUST deploy to GitHub Pages with custom domain `ronpicard.com` through the GitHub Actions workflow on pushes to `main`.
- Production asset base URL MUST be `/` for the apex domain; project Pages hosting MUST be supported by changing `prodBase` in `vite.config.ts` and `homepage` in `package.json`.
- Blog routes MUST use history URLs (`/blog/:slug`), not hash routing.

### Content and routing

- Article metadata MUST live in `src/data/siteArticles.json` and be normalized in `src/data/articles.ts`.
- Article metadata MUST pass the shared runtime schema before the app or build scripts consume it.
- Article HTML MUST be extracted to per-article files under `public/article-bodies/`; the homepage catalog MUST load metadata only.
- Public blog slugs MUST be derived from post titles (not legacy storage slugs); legacy slugs from the pre–Mar 2026 naming scheme MUST still resolve for bookmarks and prerendered paths.
- Client-side navigation to an article MUST start at the top of the page.
- Browser Back navigation from an article MUST restore the prior home catalog position without animating down from the top.
- Mirrored assets MUST live under `public/resources/` and be referenced as `resources/...` in JSON, resolved with the Vite base URL at render time.
- Posts MAY set `releasesUrl` (validated `https://github.com/<owner>/<repo>/releases/...` URL); when set, the home card and article page MUST show a Releases button immediately after Code linking to it, and MUST omit the button otherwise.
- Remote mirrored assets MUST come from explicit HTTPS hosts, pass redirect and query validation, remain under 20 MiB, match a passive file signature, and MUST NOT include SVG.
- After `vite build`, prerender MUST emit static `index.html` per home and blog route with real `<title>`, Open Graph tags, and JSON-LD; Open Graph images MUST include pixel dimensions and alt text when the image is a mirrored local file.
- Prerendered pages MUST include the route's app markup in `#root` (rendered by the SSR bundle) so first paint shows content before hydration; the markup MUST be static — no inline scripts or streaming placeholders, which the CSP would block.
- The homepage card grid MUST load generated WebP thumbnails (`public/resources/thumbs/`, built by `npm run generate:thumbs`) instead of full-size title images, falling back to the original when a thumbnail is missing; cards above the fold SHOULD load eagerly with preload hints while the rest stay lazy.
- Blog canonical URLs, `og:url`, and sitemap entries MUST use the trailing-slash form (`/blog/<slug>/`) that GitHub Pages redirects to.
- Production MUST include `sitemap.xml`, `robots.txt`, and a dedicated `404.html` with `noindex, nofollow`.

### Dynamic GitHub README posts

- Posts MAY set `readmeRawUrl` (validated `https://raw.githubusercontent.com/...` URL) instead of a static `bodyPath`.
- The client MUST fetch README markdown at view time, show a loading state, and render sanitized HTML on success.
- The full build MUST snapshot each referenced README into `public/readme-snapshots/<slug>.md` (`npm run mirror:readmes`); a failed snapshot fetch MUST keep any existing snapshot and MUST NOT fail the build.
- When the live fetch fails, the client MUST attempt the same-origin snapshot before showing an error.
- Only when both the live fetch and the snapshot fail MUST the UI show the article summary and a safe link to view the README on GitHub.
- README fetch MUST enforce a timeout (12s), a maximum body size (512 KiB), `credentials: 'omit'`, and `referrerPolicy: 'no-referrer'`.

### Security

- All HTML rendered from JSON or fetched READMEs MUST pass through `shared/articleHtmlSanitize.ts` (DOMPurify allowlists, forbidden tags/attrs, external link hardening).
- URLs from JSON (images, demo, repo, embed, readme, extra links) MUST be validated before use in the DOM; dangerous schemes, protocol-relative URLs, traversal paths, credentials, and unapproved hosts MUST be rejected.
- Blog `:slug` route params MUST pass `isSafePublicSlug()` before loading an article.
- Search input MUST be bounded (`SEARCH_QUERY_MAX_LEN`) and match titles and summaries after the same case and whitespace normalization.
- Production HTML MUST include a Content-Security-Policy that allows only required third-party hosts (YouTube nocookie embeds, `ronpicard.github.io` frames, GitHub raw/API for README fetch).
- Web fonts MUST be self-hosted from `public/fonts/`; the CSP MUST NOT allow third-party font or stylesheet hosts.
- YouTube embeds MUST use validated video IDs and the nocookie embed host where applicable.

### Accessibility

- Each route MUST expose one visible `<h1>` and a keyboard-accessible skip link to its main content.
- Search MUST expose the ARIA combobox/listbox pattern and support Arrow Up/Down, Enter, and Escape.
- Cards MUST NOT nest interactive elements inside a card-level link role; all interactive controls MUST have visible keyboard focus.
- Narrow viewports (phone-width) MUST avoid horizontal page overflow on home and article routes.
- GitHub Pages demo embeds MUST use a tall viewport-relative frame on narrow screens and MUST offer a full-view control that expands the embed to nearly the viewport (dismissible via the control or Escape).
- The expanded full view MUST use dialog semantics (`role="dialog"`, `aria-modal`), keep Tab focus inside the overlay, and return focus to the toggle control on Escape.
- On touch-only devices (`hover: none`), inline demo embeds MUST NOT receive pointer input until a visible tap-to-interact guard is dismissed, so swipes over the embed scroll the page; full view is always interactive.
- Text inputs MUST use a font size of at least 16px so iOS Safari does not zoom the page on focus.
- While full view is open, background page scrolling MUST be locked in a way iOS Safari honors, and the scroll position MUST be restored on exit.

### Testing

- Security-sensitive helpers, tested components, and build-script boundaries MUST have unit or integration tests in Vitest.
- Unit coverage MUST pass the thresholds in `vitest.config.ts` (94% statements, 85% branches, 98% functions, 97% lines) via `npm run test:coverage`.
- Browser smoke coverage for home, keyboard navigation, search, slug redirects, demo links, phone-width embeds, and dynamic README MUST live in Playwright (`npm run test:e2e`, `e2e/site.spec.ts`); README network calls MAY be mocked in e2e.
- Playwright MUST run the suite on both a desktop project and an emulated mobile device project so touch-only behavior (like the embed tap-to-interact guard) is exercised.
- Playwright does not contribute to Vitest coverage percentages; together they cover logic (unit) and critical user flows (e2e).
- Pushes to `main` MUST enforce Vitest coverage thresholds and Playwright tests in CI before deploy; pull requests to `main` MUST run both without deploying.

### Shared code and tooling

- Logic shared between the app and Node scripts MUST live under `shared/` and be importable from both (`tsconfig.json` includes `shared/`).
- Code outside the articles feature MUST import its public API through `src/features/articles/index.ts`.
- Build and ingest scripts MUST reuse the same sanitization and routing rules as the app where they touch HTML or slugs.
- Local development and CI MUST use Node.js 22.23.2, pinned by `.nvmrc` and bounded compatibly in `package.json`.

### Content maintenance (optional workflows)

- While Squarespace remains a source, `npm run sync:articles` and `npm run mirror:resources` MAY refresh JSON, `public/article-bodies/`, and `public/resources/`; resulting files SHOULD be committed intentionally.
- Single-post merges MAY use `npm run merge:blog-post` per `scripts/merge-blog-post.mjs`.
- `npm run optimize:resources` MAY recompress mirrored images in `public/resources/` in place; it MUST keep filenames and formats so JSON references and the resource manifest stay valid.

## Non-goals

- Server-side rendering or API routes in this repo.
- Storing secrets or private tokens in the client bundle.
- Relying on `public/_headers` on plain GitHub Pages (only effective when a host serves that file, e.g. Cloudflare).
