# Deployment

This site is a static React app built with Vite and published to [GitHub Pages](https://pages.github.com/) at [ronpicard.com](https://ronpicard.com/). Deployment is fully automated through GitHub Actions; there is no separate app server or hosting stack in this repo.

## Overview

| Item | Value |
|------|-------|
| Workflow | [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) |
| Trigger branch | `main` |
| Live URL | `https://ronpicard.com/` |
| Custom domain file | [`public/CNAME`](public/CNAME) → copied into `dist/` on build |
| Node.js version | [`.nvmrc`](.nvmrc) (22.23.2) |
| Production build command | `npm run build:full` |
| Published artifact | `dist/` |

## When the workflow runs

The **Test and deploy** workflow starts on:

- **Push to `main`** — runs tests, builds, and deploys to GitHub Pages.
- **Pull request to `main`** — runs unit and browser tests only; no deploy.
- **Manual dispatch** — run from the Actions tab (`workflow_dispatch`) to redeploy without a new commit.

Concurrency is grouped under `pages` with `cancel-in-progress: false`, so an in-flight deploy is not interrupted when another push lands.

## Pipeline

```text
push to main
    │
    ├─► test (unit)          ─┐
    │     npm run test:coverage
    │
    └─► e2e (browser)        ─┤  both must pass
          npm run test:e2e    ─┘
                │
                ▼
          build (production)
            npm run build:full
            upload dist/ artifact
                │
                ▼
          deploy
            actions/deploy-pages → github-pages environment
```

### 1. Unit tests (`test`)

- Checks out the repo and installs dependencies with `npm ci`.
- Runs `npm run test:coverage` (Vitest with enforced thresholds).
- Uses the Node version from `.nvmrc`.

### 2. Browser tests (`e2e`)

- Runs in parallel with unit tests.
- Installs Chromium via `npx playwright install --with-deps chromium`.
- Runs `npm run test:e2e` against a local Vite dev server (see [`playwright.config.ts`](playwright.config.ts)).

### 3. Production build (`build`)

- Runs only when the event is **not** a pull request.
- Waits for both `test` and `e2e` to succeed.
- Runs `npm run build:full`, which:
  1. Typechecks with `tsc --noEmit`
  2. Mirrors remote assets and article HTML (`scripts/mirror-resources.mjs`)
  3. Snapshots GitHub READMEs into `public/readme-snapshots/` (`scripts/mirror-readmes.mjs`; fetch failures keep the committed snapshot)
  4. Bundles the app with Vite into `dist/`
  5. Prerenders route HTML (including per-article Open Graph image tags with dimensions), `sitemap.xml`, `robots.txt`, and `404.html` (`scripts/prerender.mjs`)
- Uploads `dist/` as a GitHub Pages artifact.

### 4. Deploy (`deploy`)

- Uses [`actions/deploy-pages@v4`](https://github.com/actions/deploy-pages) with OIDC (`id-token: write`).
- Targets the **`github-pages`** environment, which exposes the deployed URL as a workflow output.
- Publishes the uploaded artifact to GitHub Pages.

## One-time GitHub setup

These steps are required once per repository (repo owner):

1. **Enable GitHub Pages from Actions**  
   **Settings → Pages → Build and deployment → Source** → **GitHub Actions**.

2. **Custom domain**  
   The domain `ronpicard.com` is declared in `public/CNAME`. After the first successful deploy, confirm **Settings → Pages → Custom domain** shows the apex domain and HTTPS is enabled.

3. **DNS**  
   Point the domain at GitHub Pages (A/AAAA records for the apex, or a CNAME for `www` as documented by GitHub).

4. **Push authentication**  
   Pushes to `main` must use an account with write access. If `gh` is logged in as another user, run `gh auth switch` before pushing.

## What gets published

The contents of `dist/` after `build:full`:

- Vite-built JS/CSS and `index.html` (with production CSP meta tags from [`vite.config.ts`](vite.config.ts))
- Prerendered HTML for home, each blog route, sitemap, and robots
- Static files from `public/` (favicon, `CNAME`, mirrored `resources/`, `article-bodies/`, `readme-snapshots/`, self-hosted `fonts/`, etc.)

The app uses history-based routing (`react-router-dom`). GitHub Pages serves prerendered files for known routes; unknown paths fall through to the noindex `404.html`.

## Local verification before push

Match what CI runs:

```bash
nvm use
npm ci
npm run test:coverage
npx playwright install chromium   # first time only
npm run test:e2e
npm run build:full
npm run preview                   # optional: spot-check dist/
```

For content-only changes that do not need a full mirror pass, `npm run build` is enough locally; CI always runs `build:full`.

## Manual redeploy

To redeploy the current `main` commit without changing code:

1. Open **Actions → Test and deploy**.
2. Click **Run workflow**, choose branch `main`, and confirm.

## Monitoring a deploy

- **Actions tab** — watch the four jobs (`Unit tests`, `Browser tests`, `Production build`, `Deploy to GitHub Pages`).
- **Environments → github-pages** — shows the latest deployment URL and history.
- A green **Deploy to GitHub Pages** job means the site artifact was published; allow a short propagation delay before checking the live domain.

## Dependency updates

[`.github/dependabot.yml`](.github/dependabot.yml) opens weekly PRs for npm and GitHub Actions updates. Merging a Dependabot PR to `main` follows the same test-and-deploy pipeline as any other push.

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| PR checks fail on coverage | Coverage dropped below thresholds in [`vitest.config.ts`](vitest.config.ts); run `npm run test:coverage` locally. |
| E2E fails in CI but passes locally | Stale Playwright browsers locally, or dev-server port conflict; CI always installs Chromium fresh. |
| Deploy job skipped | Event was a pull request (deploy runs only on push/manual dispatch). |
| Build fails on mirror step | Remote asset fetch blocked or changed; see [`scripts/mirror-resources.mjs`](scripts/mirror-resources.mjs) and [`scripts/lib/assetSafety.mjs`](scripts/lib/assetSafety.mjs). |
| Custom domain not served | `CNAME` missing from `dist/`, DNS not pointed at GitHub, or HTTPS certificate still provisioning. |
| Wrong asset paths on live site | `prodBase` in [`vite.config.ts`](vite.config.ts) must stay `/` for the apex domain; project Pages would use `/ronpicard.com/`. |

## Related docs

- [`README.md`](README.md) — development setup and script reference
- [`REQUIREMENTS.md`](REQUIREMENTS.md) — testable deployment and security constraints
- [`CHANGELOG.md`](CHANGELOG.md) — release notes
