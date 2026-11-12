# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- BotLegger, my company's free desktop app for running your own team of AI bots, joins the portfolio as the latest project, with a written introduction, a screenshot of botlegger.com, and links to its releases and website.
- Formal Methods 101 and Software Lessons posts now show which part of the series they are ("Part 4 of 11") under the title, and link to the previous and next parts at the end.
- Long articles open with an "On this page" list of their sections and a reading time; each entry jumps to its section.
- Searching on the home page narrows the posts live as you type, matching titles and summaries, with a count of how many posts match. Escape or Show all posts clears it, and the search is kept in the address (`?q=`), so it's still there when you come back from an article.
- Three music tools join the portfolio as the latest projects, each with a screenshot thumbnail, an embedded demo, source code and demo links, and an introduction: Instrument Tuner, a chromatic and per-string tuner with a cents needle; Frequency Player, a 20 Hz–20 kHz tone generator with a note dial and piano keys; and Pitch Tracker, which draws your singing pitch on a live piano roll. The embedded Tuner and Pitch Tracker demos can't use the microphone inside the page, so they offer a link to open in their own tab.
- A BotLegger icon in the header, after Wyvern Systems, links to botlegger.com.
- A second GitHub icon in the header, between Wyvern Systems and BotLegger, opens the Wyvern Systems organization on GitHub. On narrow phones the header icons sit a little closer so the name still fits on one line.
- Links to the home and topic pages now preview with a branded card showing the rp logo, name, and tagline, and iPhones and iPads use the rp logo when the site is saved to the home screen.
- Six topic pages group the posts: Web Apps & Games; Software, Tools & Tutorials; Software Engineering Lessons; AI, Machine Learning & Autonomy; Formal Methods & Research; and Aviation & Hobbies. Each has its own address (such as `/topics/aviation/`), a short introduction, and the cards for every post in it. The home page links to all six below its introduction.
- Every article shows its topic beside its date, linking to that topic page, and ends with a More in … list of up to three nearby posts from the same topic.

### Changed

- The eleven Formal Methods 101 posts are rewritten with real section headings, typeset logic and set notation, HTML truth tables, corrected notation, and new animated diagrams (Venn diagrams, relation graphs, a backtracking SAT search, the halting-problem diagonal, induction chains), each with a series header image.
- The early research posts (N-Queens, the particle filter and model-based speed controllers, aircraft collision avoidance, the e-puck robot, the computer vision security system, and the colored Petri net studio) are now full write-ups of their papers, with animated figures of their designs and results and new header images.
- The Ubuntu router, OpenVPN, WordPress, and chess engine tutorials are reorganised into numbered steps with copyable commands, gain animated network and architecture diagrams and a note on what has changed since they were written, and the chess post's unrelated stock images are replaced with diagrams of the engine.
- Every web app and game post now has a written page: what it is, how it works, its controls, and what it is built with, taken from its source code.
- Software Lessons sessions now have session notes: what each session covers and its key ideas.
- Post summaries that stopped mid-sentence on their cards are rewritten as complete one- or two-sentence summaries.
- Every chart and diagram in the ten refreshed machine-learning posts now animates while it is on screen: bars grow in turn, curves draw from left to right, optimizer paths step across their loss surfaces, and diagrams build up stage by stage. Each takes up to about four seconds, holds the finished chart for a second, then replays. Click, tap, or press Enter or Space on a chart to pause or resume it. Charts stop when you scroll away, and with reduced motion turned on they show only the finished chart.
- In the momentum post, the chart of plain gradient descent against momentum now plays as a step-by-step race with a step counter while it is on screen. Each race takes about four seconds, holds the finished chart for a second, then replays. Click, tap, or press Enter or Space on it to pause or resume it. It stops when you scroll away, and with reduced motion turned on it shows only the finished chart.
- The new header images for the machine-learning posts are now saved at 1080p (1920 × 1008), so they look sharp on high-resolution screens.
- The nine older machine-learning posts (2-D and 3-D linear regression, the single neuron, dropout and L2 on the moons data, momentum, Adam, convolutional networks, and the forest-cover and ASNets papers) are rewritten from their notebooks and papers into full articles. Each has section headings, equations, a code excerpt or results table, two or three new charts and diagrams drawn from the notebooks' own printed results, a new header image that is also its link preview, and a full summary on its card. Where a figure is an illustration rather than the original data, its caption says so, and a short "note from 2026" flags results the original write-up misread.
- Search is now a small box with "Search" in it, next to the header icons, instead of a large pop-up panel. On phones, tap the search icon to open the box. On other pages it lists matching posts under the box, and pressing Enter shows every match on the home page.
- Linear Regression Using Gradient Descent has been refreshed as a pilot for the older posts: a new header image, also used for its link preview, that shows the data and fitted line beside the loss surface, three new charts drawn from a real run of the algorithm (the line fitting itself to the data, the path gradient descent takes across the loss surface, and the loss per iteration), section headings, properly typeset equations, a short Python implementation, a corrected loss function, and a full summary on its card and in search results instead of a cut-off sentence. Figure captions across all articles are now styled beneath their images.
- Instrument Tuner, Frequency Player, and Pitch Tracker show their new desktop layouts and brighter colours in their blog thumbnails and link previews, captured November 7, 2026.
- The LinkedIn and GitHub icons are now each company's own white logo files, unaltered, and they no longer glow on hover.
- New logo: a rounded "rp" monogram now sits before the name in the header and is the browser-tab icon, and the name is set in the rounder Outfit typeface to match it. On page load the name types out letter by letter behind a mint block cursor, which then keeps blinking.
- Links between pages now go straight to each post's final address (ending in `/`) instead of passing through a redirect first.
- Browser tabs and search results now show more descriptive titles for the web apps, games, and some flying posts, such as "Flight Simulator: Fly a Cessna 172 in Your Browser", and the home page's title now names its topics. The headings on the pages are unchanged.
- The Stockfish Chatbot, AI Chess Web App V2, Super Decathlon, First Solo, and Second Solo posts have real summaries on their cards and in search results instead of a date or a placeholder line.
- Six very short posts (Got My Boating License, X-62 VISTA Laureate Award Dinner, the Cherokee 6, Super Decathlon, and TB-10 flights, and WebGME: Railway Network Design Studio) stay on the site but ask search engines not to index them, and are left out of the sitemap.
- The AI Rulebook and Auto Color Code and Releases buttons, and the source links in their articles, point to the renamed `wyvernsystems/ai-rulebook` and `wyvernsystems/auto-color` repositories.
- On the AI Rulebook and Auto Color cards and articles, the Open VSX Registry button now comes before the VS Code Marketplace button.

### Removed

- The `sync:articles` and `merge:blog-post` commands, which scraped posts from the old Squarespace site. That site is gone, and rerunning them would have overwritten hand-edited post data.

- Home page cards' Read more links are now blue, and turn green to match the card's green outline when you hover over the card.
- Dates, post summaries such as the Blackjack Royale and Roulette Royale descriptions, quotes, and other secondary text now use the same color as article text instead of a dimmed gray.
- Home page cards for photos of Ron, such as the flying, boating, and ham radio posts, are now framed to show as much of his head as the photo allows, closer to the center, and every one fills its frame with no empty dark bars.
- Home cards now show every button their article page shows, such as the View Code links on the neural network posts, in the same order.
- The AAAx Vision post no longer has a View Video button, since the AIAA video site it pointed to has shut down.
- Buttons that link to an outside news article now just say Article instead of repeating the story's headline; links to papers still say Paper.
- Posts with no demo, video, or README, such as Got My Boating License, now show their picture at the top of the article.
- The header's LinkedIn, GitHub, and Wyvern Systems icons are now larger, bare logos without button frames, matching wyvernsystems.com, and the search icon is larger too.
- Buttons now show the logo of where they lead in its official colors: GitHub on Demo (GitHub Pages), Code, Releases, and gist links, a red PDF logo on PDF papers, and the VS Code, Open VSX, and Wyvern Systems logos on the extension store buttons. The YouTube button's logo is now YouTube's red.
- The header's LinkedIn and GitHub icons now use their standard brand looks: LinkedIn's blue square with a white "in", and GitHub's white mark.
- The header now has a Wyvern Systems button, showing the company's wyvern logo beside the LinkedIn and GitHub icons and linking to wyvernsystems.com in a new tab.
- The Slots Royale card has a fresh screenshot of the whole machine with its new domed buttons and leather stool, and its introduction says the camera now opens wide on the cabinet.
- The Mustang Showroom card shows the car's new gunmetal paint and five-spoke wheels.
- The Mustang Showroom card has a fresh screenshot of the spot-lit car and an introduction that now mentions the recorded V8, the amber turn signals, and the see-through part selection.
- Every blog post now shares a 1200×630 social preview card made from its own image, so links on Facebook, LinkedIn, and X show the whole picture instead of cropping portrait, square, and small images.
- The ClamAV Control card is labelled Desktop app instead of Article.
- The home page's search and link-preview description now summarizes the site instead of repeating its title.
- Neon Pinball's blog thumbnail, social link preview, and introduction show its new arcade room, dot-matrix scoreboard, and low default camera, captured September 20, 2026.
- Marble Tilt's blog thumbnail, social link preview, and introduction show its new two-storey boards with ramps, decks, and bridges in the isometric view, captured September 20, 2026.
- Orbit Golf's blog thumbnail, social link preview, and introduction reflect its mini-golf redesign with walled courses, the alien golfer, and the new space backdrop, captured September 19, 2026.
- Pool Rooms' blog thumbnail and social link preview use a fresh gameplay screenshot of the updated Sun Pavilion, captured September 13, 2026.
- Periodic Table Element Visualizer's blog thumbnail and social link preview use a fresh screenshot of the updated elemental interface, captured September 13, 2026.
- Fish Tank Simulator's blog thumbnail and social link preview use a fresh screenshot of the updated aquarium, captured September 13, 2026.
- The portfolio grid has larger project titles, brighter dates and supporting text, more room at the edges on phones, and subtle thumbnail framing adjustments. The compact header, neon theme, and three-column desktop layout remain.
- The background uses sparse, slow teal circuit signals with occasional blue accents, short fading tails, subtle junction glows, and staggered quiet intervals. Signals favor card gaps and margins and dim beneath cards and the header; article content stays clear and reduced-motion users get a static frame.
- The ClamAV Control post now describes the current Tauri 2 + Rust desktop app instead of the retired Electron build, and its repo link and live README point at the renamed `clamav-antivirus-ui` repository; its card image is a fresh v2.2.0 Status screen screenshot.
- The home page now opens with a short introduction under a "Projects in AI, software & aviation" heading, and each card shows a two-line summary of its post.
- Search engines and link previews now get each post's full article text, a publish date, and richer structured data (author profile links, breadcrumbs, and video and source-code details where a post has them), instead of a loading placeholder.
- Article images, card thumbnails, and post pictures now carry descriptive alt text.

### Fixed

- Link previews and search results for some Software Lessons posts no longer show stray "&amp;" or "&quot;" codes in their descriptions, and the lesson outlines show "&" where they showed "&amp;".
- The browser console no longer shows a Content-Security-Policy error on every page load.
- Pages no longer carry two copies of their title, description, and link-preview tags once the page loads, and moving between pages now updates the structured data too.
- Twelve web app posts and two video posts that had no summary now have one, so their cards, search, and link previews describe them.
- Fixed spelling and grammar across many posts, their summaries, the page title, and a few button labels (for example GitHub and WebSim are now capitalized correctly). The router, VPN, and WordPress guides now say nano saves with control-x, and a few technical slips are corrected, such as disjunction versus conjunction in the logic posts.
- Software Lessons Session 11 is labelled Lesson like the rest of the series instead of Article.
- Corrected the titles "Linear Regression Using Gradient Descent" (was "Decent") and "Formal Methods 101: Satisfiability Modulo Theories (SMT)" (was "Satisfiable"); links to the old addresses still work.
- Neon Pinball now appears ahead of Marble Tilt as the most recent project; the two share a date and were listed the wrong way round.
- Pool Rooms' Start Exploring button now starts the game inside the blog embed.

### Added

- An RSS feed of every post at `/feed.xml`, advertised to feed readers from every page.
- Flight Simulator joins the portfolio as the latest project, with the same cockpit-over-Manhattan picture as the simulator's own link preview for its thumbnail and link preview, interactive embedded demo, source code link, and an introduction to its Cessna 172 cockpit, LaGuardia departure, 3D New York scenery, and scripted ATC radio.
- A new article introduces AI Rulebook, my free VS Code and Open VSX extension from Wyvern Systems LLC that manages always-on rules for AI coding agents in `AGENTS.md`. It is dated April 29, 2026, when the extension was first released, and uses the extension's icon as its card image, with Code, Releases, VS Code Marketplace, Open VSX Registry, and Wyvern Systems buttons on both its home card and article page.
- A new article introduces Auto Color, my free VS Code and Open VSX extension from Wyvern Systems LLC that gives every workspace its own color. It is dated April 13, 2026, when the extension was first released, and uses the extension's icon as its card image, with VS Code and Cursor screenshots in the article and Code, Releases, VS Code Marketplace, Open VSX Registry, and Wyvern Systems buttons on both its home card and article page.
- Mustang Showroom joins the portfolio as the latest project, with a showroom thumbnail, interactive embedded demo, source code link, and an introduction to its 1969 Mustang on a turntable, opening panels, explode view, and parts catalogue.
- Blackjack Royale joins the portfolio as the latest project, with a gameplay thumbnail, interactive embedded demo, source code link, and an introduction to its casino blackjack table, card overlay, and cheering crowd.
- Slots Royale joins the portfolio, listed just after Blackjack Royale under the same date, with a gameplay thumbnail, interactive embedded demo, source code link, and an introduction to its five-reel slot machine with blurred reels, free spins, and a jackpot.
- Roulette Royale joins the portfolio as the latest project, with a gameplay thumbnail, interactive embedded demo, source code link, and an introduction to its casino roulette table and simulated ball.
- Domino Topple joins the portfolio, listed just after Roulette Royale under the same date, with a gameplay thumbnail, interactive embedded demo, source code link, and an introduction to its chain-reaction puzzles in three furnished rooms.
- Neon Pinball joins the portfolio as the latest project, with a gameplay thumbnail, interactive embedded demo, source code link, and an introduction to its retro arcade 3D pinball machine.
- Marble Tilt joins the portfolio as the latest project, with a gameplay thumbnail, interactive embedded demo, source code link, and an introduction to its tilt-the-board labyrinth.
- Orbit Golf joins the portfolio as the latest project, with a gameplay thumbnail, interactive embedded demo, source code link, and an introduction to its gravity-slingshot puzzles.
- Fish Tank Simulator joins the portfolio as the latest project, with an aquarium thumbnail, interactive embedded demo, source code link, and an introduction to Pelagic's saltwater reef.
- Pool Rooms joins the portfolio as the newest project, with a gameplay thumbnail, playable embedded demo, source code link, and a short introduction to the pool complex.
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

- The HTML cleaner for embedded GitHub READMEs (DOMPurify) is updated to 3.4.17 for a critical advisory.
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
