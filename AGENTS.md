# Agent guide

Facts an AI agent (or new contributor) needs before changing this repo. For full context see [README.md](README.md), [REQUIREMENTS.md](REQUIREMENTS.md), and [DEPLOYMENT.md](DEPLOYMENT.md).

## Setup and commands

- Node.js 22.23.2, pinned by `.nvmrc` (`nvm use`), then `npm install`.
- `npm run dev` — Vite dev server (usually `http://localhost:5173/`).
- `npm test` — Vitest unit tests, fast; run after any code change.
- `npm run test:coverage` — same tests with enforced thresholds (92% statements, 84% branches, 94% functions, 95% lines). CI gates deploys on this, so new code needs tests before it lands.
- `npm run test:e2e` — Playwright smoke tests (`e2e/site.spec.ts`); starts its own dev server. First run needs `npx playwright install chromium`.
- `npm run build` — typecheck + Vite bundle; enough for local verification of code-only changes.
- `npm run build:full` — full production pipeline (typecheck, mirror assets, snapshot READMEs, bundle, prerender). Needs network and may rewrite `src/data/siteArticles.json` — commit resulting changes intentionally.

## Architecture facts

- Static SPA, no server: React 19 + React Router history URLs (`/`, `/blog/:slug`), deployed to GitHub Pages by `.github/workflows/deploy.yml` on push to `main`.
- Logic shared between the app and Node scripts lives in `shared/`; scripts import TypeScript directly via `node --experimental-strip-types`.
- Code outside the articles feature imports it only through `src/features/articles/index.ts`.
- Article content is data: metadata in `src/data/siteArticles.json`, bodies in `public/article-bodies/`, mirrored assets in `public/resources/` (hash-named, committed), README snapshots in `public/readme-snapshots/`, self-hosted fonts in `public/fonts/`.
- `scripts/prerender.mjs` writes per-route SEO HTML after the bundle; blog canonical URLs use the trailing-slash form (`/blog/<slug>/`).

## Security invariants (do not weaken)

- Every piece of HTML from JSON or fetched READMEs passes through `shared/articleHtmlSanitize.ts`.
- Every URL from JSON is validated before touching the DOM (`src/lib/safeUrls.ts`, `src/lib/assetUrl.ts`); slugs pass `isSafePublicSlug()`.
- The production CSP is built in `src/config/security.ts` and asserted in `src/config/security.test.ts` — change both together, and do not add third-party hosts without need (fonts are self-hosted on purpose).
- Build-time fetch scripts enforce exact hosts, validated redirects, size caps, and passive file signatures (`scripts/lib/`).

## Conventions and docs triggers

- Working-agreement rules live in `.claude/rules/ai-rules/` (mirrored in `.cursor/rules/ai-rules/`): scope discipline, markdown style, docs update triggers, git and test conventions. Read them before large changes.
- On behavior change, update `CHANGELOG.md` under `[Unreleased]` (user-facing wording) and the matching constraint in `REQUIREMENTS.md`.
- `README.md` embeds test counts and coverage numbers — refresh them when tests are added or removed.
- Image edits in `public/resources/` must keep filenames and formats (`npm run optimize:resources` does this) so JSON references and `scripts/resource-manifest.json` stay valid.
