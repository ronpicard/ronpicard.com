# Requirements

Functional and security constraints for **ronpicard.com**. Update this file when behavior or acceptance criteria change.

## Requirements

### Site and deployment

- The site MUST be a static SPA (HTML/CSS/JS only); this repo MUST NOT require an application server or database at runtime.
- Production MUST deploy to GitHub Pages with custom domain `ronpicard.com` through the GitHub Actions workflow on pushes to `main`.
- Production asset base URL MUST be `/` for the apex domain; project Pages hosting MUST be supported by changing `prodBase` in `vite.config.ts` and `homepage` in `package.json`.
- Blog routes MUST use history URLs (`/blog/:slug`), not hash routing. Topic hubs MUST live at `/topics/:topic`; an unknown topic MUST redirect home.

### Portfolio presentation

- The homepage MUST remain a simple project catalog with a compact header and uniform cards in the existing dark neon theme.
- The grid MUST use three columns at viewport widths of 68rem and above, two from 40rem to below 68rem, and one below 40rem.
- Card titles MUST use 1.25rem text; homepage dates and supporting text MUST remain readable against the dark background.
- Phone-width homepage layouts MUST provide at least 1.25rem side padding, respect safe-area insets, and keep the brand and social controls within the viewport.
- The header MUST offer LinkedIn (in LinkedIn's brand blue and white), GitHub (its standard white mark), and Wyvern Systems (`https://wyvernsystems.com/`, drawn from the company logo in `public/wyvern-systems-logo.png`) icon links, in that order after the search control, drawn as bare logos without a button frame, each opening in a new tab with `rel="noopener noreferrer"`; the brand MUST stay on one line beside them at 375px-wide phone viewports.
- Buttons that lead to GitHub (Code, Releases, repository and gist links) or a GitHub Pages site (`*.github.io`, including every Demo), the VS Code Marketplace, the Open VSX Registry, or wyvernsystems.com MUST show that destination's logo, in its official colors, before the label; buttons to a `.pdf` file MUST show a PDF logo; YouTube buttons MUST show YouTube's red logo. Buttons to other hosts MUST NOT show a logo.
- Thumbnail framing MAY be adjusted per project using presentation styles; the original image files, formats, and references MUST be preserved.
- Secondary text (dates, summaries, quotes, footer, and previous/next labels) MUST use the same color as article body text, not a dimmed variant; only input placeholders MAY be dimmer.
- Card thumbnails of photos showing Ron SHOULD show as much of his head as the photo allows, as close to the center as the crop allows, and MUST fill the card frame with no empty or transparent bars.

### Background animation

- Background signals MUST follow the 40px grid with right-angle turns, short fading tails, sparse teal pulses, occasional muted blue accents, and quiet intervals between replacement signals.
- Signals MUST favor open space and dim beneath homepage cards and the header; article exclusion zones MUST remain clear.
- Reduced-motion users MUST receive a static frame, and the animation MUST NOT track the pointer or use parallax.

### Content and routing

- Article metadata MUST live in `src/data/siteArticles.json` and be normalized in `src/data/articles.ts`.
- The Pool Rooms project MUST use a current local gameplay screenshot for its blog thumbnail and Open Graph image.
- The Periodic Table Element Visualizer project MUST use a current local screenshot of its elemental interface for its blog thumbnail and Open Graph image.
- The Fish Tank Simulator project MUST use a current local aquarium screenshot for its blog thumbnail and Open Graph image, include a short introduction and playable demo and source code links, and appear ahead of Pool Rooms among the September 12, 2026 additions.
- The Orbit Golf project MUST include a local gameplay thumbnail, a short introduction, and playable demo and source code links; it MUST appear first as the September 19, 2026 addition.
- The Orbit Golf project MUST use a current local gameplay screenshot for its blog thumbnail and Open Graph image.
- The Marble Tilt project MUST include a local gameplay thumbnail, a short introduction, and playable demo and source code links; it MUST appear second among the September 20, 2026 additions, after Neon Pinball.
- The Marble Tilt project MUST use a current local gameplay screenshot for its blog thumbnail and Open Graph image.
- The Neon Pinball project MUST include a local gameplay thumbnail, a short introduction, and playable demo and source code links; it MUST appear first among the September 20, 2026 additions.
- The Neon Pinball project MUST use a current local gameplay screenshot for its blog thumbnail and Open Graph image.
- The Roulette Royale project MUST include a local gameplay thumbnail, a short introduction, and playable demo and source code links; it MUST appear first among the September 24, 2026 additions.
- The Roulette Royale project MUST use a current local gameplay screenshot for its blog thumbnail and Open Graph image.
- The Domino Topple project MUST include a local gameplay thumbnail, a short introduction, and playable demo and source code links; it MUST appear second among the September 24, 2026 additions, after Roulette Royale.
- The Domino Topple project MUST use a current local gameplay screenshot for its blog thumbnail and Open Graph image.
- The Mustang Showroom project MUST include a local showroom thumbnail, a short introduction, and playable demo and source code links; it MUST appear first among the September 26, 2026 additions.
- The Mustang Showroom project MUST use a current local screenshot for its blog thumbnail and Open Graph image.
- The Blackjack Royale project MUST include a local gameplay thumbnail, a short introduction, and playable demo and source code links; it MUST appear second among the September 26, 2026 additions, after Mustang Showroom.
- The Blackjack Royale project MUST use a current local gameplay screenshot for its blog thumbnail and Open Graph image.
- The Slots Royale project MUST include a local gameplay thumbnail, a short introduction, and playable demo and source code links; it MUST appear third among the September 26, 2026 additions, after Blackjack Royale.
- The Slots Royale project MUST use a current local gameplay screenshot for its blog thumbnail and Open Graph image.
- The Flight Simulator project MUST include a local cockpit thumbnail, a short introduction, and playable demo and source code links; it MUST appear first as the October 3, 2026 addition.
- The Flight Simulator project MUST use a local copy of the flight simulator repository's own Open Graph image (the cockpit over Manhattan) for its blog thumbnail and Open Graph image.
- The AI Rulebook article MUST use the extension's local icon, uncropped, for its blog thumbnail and Open Graph image, include a written article body, show Code (`wyvernsystems/ai-rulebook`), Releases (latest GitHub release), Open VSX Registry, VS Code Marketplace, and Wyvern Systems buttons, in that order, on both its home card and article page, and be dated April 29, 2026, the extension's original release date.
- The Auto Color article MUST use the extension's local icon, uncropped, for its blog thumbnail and Open Graph image, include a written article body, show Code (`wyvernsystems/auto-color`), Releases (latest GitHub release), Open VSX Registry, VS Code Marketplace, and Wyvern Systems buttons, in that order, on both its home card and article page, and be dated April 13, 2026, the extension's original release date.
- Article metadata MUST pass the shared runtime schema before the app or build scripts consume it.
- Article HTML MUST be extracted to per-article files under `public/article-bodies/`; the homepage catalog MUST load metadata only.
- Public blog slugs MUST be derived from post titles (not legacy storage slugs); legacy slugs from the pre–Mar 2026 naming scheme MUST still resolve for bookmarks and prerendered paths.
- Client-side navigation to an article MUST start at the top of the page.
- Browser Back navigation from an article MUST restore the prior home catalog position without animating down from the top.
- Mirrored assets MUST live under `public/resources/` and be referenced as `resources/...` in JSON, resolved with the Vite base URL at render time.
- Posts MAY set `releasesUrl` (validated `https://github.com/<owner>/<repo>/releases/...` URL); when set, the home card and article page MUST show a Releases button immediately after Code linking to it, and MUST omit the button otherwise.
- A post's home card MUST show the same buttons as its article page, in the same order: Demo, Code, Releases, YouTube, then every `extraLinks` entry. The `card` flag on `extraLinks` entries no longer changes anything. Links to third-party articles MUST be labelled Article, except papers, which MUST be labelled Paper.
- A post with no demo embed, YouTube video, other embed, or README MUST show its picture (`articleHeroUrl`, else `imageUrl`) at the top of the article page.
- Remote mirrored assets MUST come from explicit HTTPS hosts, pass redirect and query validation, remain under 20 MiB, match a passive file signature, and MUST NOT include SVG.
- After `vite build`, prerender MUST emit static `index.html` per home, blog, and topic route with real `<title>`, Open Graph tags, and JSON-LD; Open Graph images MUST include pixel dimensions and alt text when the image is a mirrored local file.
- Prerender and the client MUST build head tags from one shared builder (`shared/seoHead.ts`). Each page MUST carry exactly one title, description, canonical, and JSON-LD block, before and after client navigation; navigation MUST replace all of them, JSON-LD included.
- Post meta and JSON-LD descriptions MUST be entity-decoded plain text. Blog routes MUST carry `article:published_time`. JSON-LD MUST describe the site owner as a Person with `sameAs` profile links, and each post as a BlogPosting with author, publisher, image, and a BreadcrumbList, plus a VideoObject for a valid YouTube ID and SoftwareSourceCode for a valid GitHub repo URL.
- Each blog post MUST share a generated 1200×630 card of its own image (`public/resources/og/`, built by `npm run generate:og`) as its Open Graph and Twitter image, showing portrait, square, and small images uncropped; a post MUST fall back to its original image when no card exists.
- Every Software Lessons session MUST carry the Lesson badge regardless of its source slug, and release-shipped desktop software MUST carry a Desktop app badge. A post with a written article body MUST keep the Article badge even when it sets `releasesUrl`.
- Correcting a published post title MUST keep the post reachable at the URL derived from its old title.
- Prerendered pages MUST include the route's app markup in `#root` (rendered by the SSR bundle) so first paint shows content before hydration; the markup MUST be static — no inline scripts or streaming placeholders, which the CSP would block.
- A post with a `bodyPath` MUST have its sanitized article body in its prerendered HTML, and the client MUST hydrate that body without refetching it; a missing body file MUST NOT fail the build (the client fetch remains the fallback).
- The homepage card grid MUST load generated WebP thumbnails (`public/resources/thumbs/`, built by `npm run generate:thumbs`) instead of full-size title images, falling back to the original when a thumbnail is missing; cards above the fold SHOULD load eagerly with preload hints while the rest stay lazy.
- Blog canonical URLs, `og:url`, sitemap entries, and every in-app link to a post or topic MUST use the trailing-slash form (`/blog/<slug>/`, `/topics/<topic>/`) that GitHub Pages redirects to.
- Every post MUST belong to one topic (`shared/articleTopics.ts`): its JSON `topic`, else its kind's default. Topic pages MUST carry a CollectionPage with an ItemList of their posts; a post's BreadcrumbList MUST run Home → topic → post. Article pages MUST link to their topic and list up to three nearby posts from it; the home page MUST link to every topic page.
- A row's optional `seoTitle` MUST replace the visible title in `<title>`, `og:title`, and `twitter:title` only. A row with `noindex: true` MUST carry `noindex, follow` and be left out of the sitemap, while staying listed and reachable on the site.
- Production MUST include `sitemap.xml`, `robots.txt`, an RSS 2.0 feed at `feed.xml` (advertised by a `rel="alternate"` link in every page's head), and a dedicated `404.html` with `noindex, nofollow`. The home sitemap entry's `lastmod` MUST be the newest post date, and each topic entry's the newest date in that topic.

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
- The Pool Rooms demo iframe MUST allow its form-based Start Exploring action; `allow-forms` MUST be limited to the exact approved `https://ronpicard.github.io/pool-rooms-game-web-app/` demo URL.
- Blog `:slug` route params MUST pass `isSafePublicSlug()` before loading an article.
- Search input MUST be bounded (`SEARCH_QUERY_MAX_LEN`) and match titles and summaries after the same case and whitespace normalization.
- Production HTML MUST include a Content-Security-Policy that allows only required third-party hosts (YouTube nocookie embeds, `ronpicard.github.io` frames, GitHub raw/API for README fetch). Because the CSP is delivered in a `<meta>` tag, it MUST NOT include header-only directives such as `frame-ancestors`, which browsers ignore there.
- Web fonts MUST be self-hosted from `public/fonts/`; the CSP MUST NOT allow third-party font or stylesheet hosts.
- YouTube embeds MUST use validated video IDs and the nocookie embed host where applicable.

### Accessibility

- Each route MUST expose one visible `<h1>` and a keyboard-accessible skip link to its main content. Article pages MUST wrap the post's header and content in an `<article>` inside `<main>`.
- Article body images MUST have descriptive `alt` text unless purely decorative.
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
- Unit coverage MUST pass the thresholds in `vitest.config.ts` (92% statements, 84% branches, 94% functions, 95% lines) via `npm run test:coverage`.
- Browser smoke coverage for home, keyboard navigation, SEO head tags across navigation, search, slug redirects, demo links, phone-width embeds, and dynamic README MUST live in Playwright (`npm run test:e2e`, `e2e/site.spec.ts`); README network calls MAY be mocked in e2e.
- Playwright MUST run the suite on both a desktop project and an emulated mobile device project so touch-only behavior (like the embed tap-to-interact guard) is exercised.
- Playwright does not contribute to Vitest coverage percentages; together they cover logic (unit) and critical user flows (e2e).
- Pushes to `main` MUST enforce Vitest coverage thresholds and Playwright tests in CI before deploy; pull requests to `main` MUST run both without deploying.

### Shared code and tooling

- Logic shared between the app and Node scripts MUST live under `shared/` and be importable from both (`tsconfig.json` includes `shared/`).
- Code outside the articles feature MUST import its public API through `src/features/articles/index.ts`.
- Build and ingest scripts MUST reuse the same sanitization and routing rules as the app where they touch HTML or slugs.
- Local development and CI MUST use Node.js 22.23.2, pinned by `.nvmrc` and bounded compatibly in `package.json`.

### Content maintenance (optional workflows)

- `src/data/siteArticles.json` MUST be edited by hand; no script may regenerate it from scratch. `npm run mirror:resources` MAY refresh `public/article-bodies/` and `public/resources/` and rewrite asset URLs in place; resulting files SHOULD be committed intentionally.
- `npm run optimize:resources` MAY recompress mirrored images in `public/resources/` in place; it MUST keep filenames and formats so JSON references and the resource manifest stay valid.

## Non-goals

- Server-side rendering or API routes in this repo.
- Storing secrets or private tokens in the client bundle.
- Relying on `public/_headers` on plain GitHub Pages (only effective when a host serves that file, e.g. Cloudflare).
