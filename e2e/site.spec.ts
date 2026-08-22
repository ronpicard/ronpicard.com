import { expect, test } from '@playwright/test'

test.describe('home', () => {
  test('loads project list and opens an article card', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1, name: 'My projects' })).toBeVisible()
    const list = page.locator('.project-list')
    await expect(list.locator('.project-card').first()).toBeVisible()

    await page.getByRole('link', { name: /Open Periodic Table Element Visualizer/i }).click()
    await expect(page).toHaveURL(/\/blog\/periodic-table-element-visualizer\/?$/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Periodic Table/i)
  })

  test('offers a keyboard skip link', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Tab')
    const skipLink = page.getByRole('link', { name: 'Skip to main content' })
    await expect(skipLink).toBeFocused()
    await skipLink.press('Enter')
    await expect(page.locator('#main-content')).toBeFocused()
  })

  test('shows AI Chess demo and code actions on its card and article', async ({ page }) => {
    await page.goto('/')
    const card = page.locator('.project-card').filter({ hasText: 'AI Chess Web App V2' })
    await expect(card.getByRole('link', { name: 'Demo' })).toBeVisible()
    await expect(card.getByRole('link', { name: 'Code' })).toBeVisible()

    await card.locator('.project-card__overlay-link').click()
    const actions = page.locator('.article-actions--primary')
    await expect(actions.getByRole('link', { name: 'Demo' })).toHaveAttribute(
      'href',
      'https://ronpicard.github.io/chess-web-app/',
    )
    await expect(actions.getByRole('link', { name: 'Code' })).toBeVisible()
    await expect(actions.getByRole('link', { name: /Try on github/i })).toHaveCount(0)
  })
})

test.describe('search', () => {
  test('filters articles, supports arrow selection, and closes on Escape', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Search posts' }).click()
    const input = page.getByRole('combobox', { name: 'Search articles' })
    await expect(input).toBeFocused()
    await input.fill('ClamAV')
    const option = page.getByRole('option', { name: /ClamAV Control/i })
    await expect(option).toBeVisible()
    await page.keyboard.press('ArrowDown')
    await expect(option).toHaveAttribute('aria-selected', 'true')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/blog\/clamav-control\/?$/)

    await page.getByRole('button', { name: 'Search posts' }).click()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('combobox', { name: 'Search articles' })).toHaveCount(0)
  })
})

test.describe('article routes', () => {
  test('expands article pages across most of the viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/blog/periodic-table-element-visualizer')
    const width = await page.locator('.page--article').evaluate((element) => {
      return element.getBoundingClientRect().width
    })
    expect(width).toBeGreaterThan(1440 * 0.9)
    expect(width).toBeLessThan(1440)
  })

  test('renders HTML article prose', async ({ page }) => {
    await page.goto(
      '/blog/software-lessons-session-25-cursor-and-claude-agentic-coding-workflow',
    )
    await expect(page.locator('.article-prose')).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('.article-prose')).toContainText(/Introduction|AI|Cursor/i)
  })

  test('redirects invalid slug to home', async ({ page }) => {
    await page.goto('/blog/not-a-real-slug-xyz')
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByText('My projects')).toBeVisible()
  })

  test('redirects legacy slug to canonical title slug', async ({ page }) => {
    await page.goto('/blog/periodic-table-element-visualizer-web-app')
    await expect(page).toHaveURL(/\/blog\/periodic-table-element-visualizer\/?$/)
  })

  test('shows demo link for GitHub Pages apps', async ({ page }) => {
    await page.goto('/blog/periodic-table-element-visualizer')
    const demo = page.getByRole('link', { name: 'Demo' })
    await expect(demo).toBeVisible()
    await expect(demo).toHaveAttribute('href', /^https:\/\/ronpicard\.github\.io\//)
    await expect(demo).toHaveAttribute('rel', /noopener/)
  })

  test('groups extra links with the primary actions above article content', async ({ page }) => {
    await page.goto('/blog/aircraft-automated-collision-avoidance')
    const actions = page.locator('.article-actions--primary')
    await expect(actions.getByRole('link', { name: 'Code' })).toBeVisible()
    await expect(actions.getByRole('link', { name: 'Paper' })).toBeVisible()
    const content = page.locator('.article-prose, .article-summary-plain')
    await expect(content).toBeVisible()
    const actionsBox = await actions.boundingBox()
    const contentBox = await content.boundingBox()
    expect(actionsBox).not.toBeNull()
    expect(contentBox).not.toBeNull()
    expect(actionsBox!.y).toBeLessThan(contentBox!.y)
  })
})

test.describe('dynamic README', () => {
  test('renders mocked README markdown as sanitized HTML', async ({ page }) => {
    await page.route('https://raw.githubusercontent.com/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/plain; charset=utf-8',
        body: '# ClamAV Control\n\n**Mocked README** body for e2e.\n\n<script>alert(1)</script>\n',
      })
    })

    await page.goto('/blog/clamav-control')
    await expect(page.locator('.article-readme-dynamic .article-prose')).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.locator('.article-prose')).toContainText('Mocked README')
    await expect(page.locator('.article-prose script')).toHaveCount(0)
  })

  test('shows error fallback when README fetch fails', async ({ page }) => {
    await page.route('https://raw.githubusercontent.com/**', async (route) => {
      await route.fulfill({ status: 500, body: 'fail' })
    })

    await page.goto('/blog/clamav-control')
    await expect(page.getByText('Could not load the README from GitHub.')).toBeVisible({
      timeout: 15_000,
    })
    await expect(page.getByRole('link', { name: 'Open it on GitHub' })).toHaveAttribute(
      'href',
      /github\.com/,
    )
  })
})
