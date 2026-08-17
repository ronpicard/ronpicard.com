import { expect, test } from '@playwright/test'

test.describe('home', () => {
  test('loads project list and opens an article card', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('My projects')).toBeVisible()
    const list = page.locator('.project-list')
    await expect(list.locator('.project-card').first()).toBeVisible()

    await page.getByRole('link', { name: /Open Periodic Table Element Visualizer/i }).click()
    await expect(page).toHaveURL(/\/blog\/periodic-table-element-visualizer\/?$/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Periodic Table/i)
  })
})

test.describe('search', () => {
  test('filters articles and closes on Escape', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Search posts' }).click()
    const input = page.getByLabel('Search articles')
    await expect(input).toBeFocused()
    await input.fill('ClamAV')
    await expect(
      page.locator('.site-search__results').getByRole('link', { name: /ClamAV Control/i }),
    ).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(input).toHaveCount(0)
  })
})

test.describe('article routes', () => {
  test('renders HTML article prose', async ({ page }) => {
    await page.goto(
      '/blog/software-lessons-session-25-cursor-and-claude-agentic-coding-workflow',
    )
    await expect(page.locator('.article-prose')).toBeVisible()
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
