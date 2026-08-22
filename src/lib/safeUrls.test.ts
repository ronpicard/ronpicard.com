import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  safeArticleLinkHref,
  safeDemoUrl,
  safeGithubPagesUrl,
  safeGithubReadmeRawUrl,
  safeGithubRepoUrl,
  safeHttpUrl,
  safeHttpsEmbedUrl,
  safeYoutubeId,
} from './safeUrls'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('safeYoutubeId', () => {
  it('accepts valid ids and rejects garbage', () => {
    expect(safeYoutubeId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(safeYoutubeId('not valid!')).toBeNull()
    expect(safeYoutubeId('')).toBeNull()
    expect(safeYoutubeId(null)).toBeNull()
  })
})

describe('safeGithubPagesUrl', () => {
  it('only allows ronpicard.github.io over https', () => {
    expect(safeGithubPagesUrl('https://ronpicard.github.io/demo/')).toContain('ronpicard.github.io')
    expect(safeGithubPagesUrl('https://evil.github.io/')).toBeNull()
    expect(safeGithubPagesUrl('http://ronpicard.github.io/')).toBeNull()
    expect(safeGithubPagesUrl('not a url')).toBeNull()
    expect(safeGithubPagesUrl('https://user@ronpicard.github.io/demo/')).toBeNull()
    expect(safeGithubPagesUrl(undefined)).toBeNull()
  })
})

describe('safeGithubReadmeRawUrl', () => {
  it('allows raw.githubusercontent README paths', () => {
    const url =
      'https://raw.githubusercontent.com/ronpicard/clamav-antivirus-control-gui/main/README.md'
    expect(safeGithubReadmeRawUrl(url)).toBe(url)
  })

  it('rejects invalid path segments', () => {
    expect(
      safeGithubReadmeRawUrl('https://raw.githubusercontent.com/bad owner/r/main/README.md'),
    ).toBeNull()
  })

  it('rejects paths with too few segments', () => {
    expect(safeGithubReadmeRawUrl('https://raw.githubusercontent.com/o/r/main')).toBeNull()
  })

  it('rejects wrong hosts, protocols, credentials, traversal, and malformed URLs', () => {
    expect(safeGithubReadmeRawUrl('http://raw.githubusercontent.com/o/r/main/README.md')).toBeNull()
    expect(safeGithubReadmeRawUrl('https://github.com/o/r/main/README.md')).toBeNull()
    expect(
      safeGithubReadmeRawUrl('https://user@raw.githubusercontent.com/o/r/main/README.md'),
    ).toBeNull()
    expect(
      safeGithubReadmeRawUrl('https://raw.githubusercontent.com/o/r/%2e%2e/README.md'),
    ).toBeNull()
    expect(safeGithubReadmeRawUrl('not a url')).toBeNull()
    expect(safeGithubReadmeRawUrl(null)).toBeNull()
  })
})

describe('safeGithubRepoUrl', () => {
  it('allows github.com repo URLs', () => {
    expect(safeGithubRepoUrl('https://github.com/ronpicard/clamav-antivirus-control-gui')).toContain(
      'github.com',
    )
    expect(safeGithubRepoUrl('https://www.github.com/ronpicard/repo')).toContain('www.github.com')
  })

  it('rejects malformed, insecure, credentialed, and third-party URLs', () => {
    expect(safeGithubRepoUrl('not a url')).toBeNull()
    expect(safeGithubRepoUrl('http://github.com/ronpicard/repo')).toBeNull()
    expect(safeGithubRepoUrl('https://gitlab.com/ronpicard/repo')).toBeNull()
    expect(safeGithubRepoUrl('https://user@github.com/ronpicard/repo')).toBeNull()
    expect(safeGithubRepoUrl('')).toBeNull()
  })
})

describe('safeHttpsEmbedUrl', () => {
  it('allowlists known embed hosts', () => {
    expect(safeHttpsEmbedUrl('https://www.youtube-nocookie.com/embed/x')).not.toBeNull()
    expect(safeHttpsEmbedUrl('https://ronpicard.github.io/demo/')).not.toBeNull()
    expect(safeHttpsEmbedUrl('https://evil.test/embed')).toBeNull()
    expect(safeHttpsEmbedUrl('http://ronpicard.github.io/demo/')).toBeNull()
    expect(safeHttpsEmbedUrl('https://user@ronpicard.github.io/demo/')).toBeNull()
    expect(safeHttpsEmbedUrl('not a url')).toBeNull()
    expect(safeHttpsEmbedUrl(undefined)).toBeNull()
  })
})

describe('safeHttpUrl', () => {
  it('rejects dangerous schemes', () => {
    expect(safeHttpUrl('javascript:alert(1)')).toBeNull()
    expect(safeHttpUrl('data:text/html,<script>')).toBeNull()
  })

  it('allows http in development', () => {
    vi.stubEnv('PROD', false)
    expect(safeHttpUrl('http://localhost:5173/')).toContain('http://localhost:5173')
  })

  it('accepts https URLs', () => {
    expect(safeHttpUrl('https://example.com/path')).toContain('https://example.com/path')
    expect(safeHttpUrl('not a url')).toBeNull()
    expect(safeHttpUrl('https://user@example.com/path')).toBeNull()
    expect(safeHttpUrl(null)).toBeNull()
  })

  it('requires https when PROD is set', () => {
    vi.stubEnv('PROD', true)
    expect(safeHttpUrl('http://example.com/')).toBeNull()
    expect(safeHttpUrl('https://example.com/')).toContain('https://example.com')
  })
})

describe('safeDemoUrl', () => {
  it('delegates to GitHub Pages allowlist', () => {
    expect(safeDemoUrl('https://ronpicard.github.io/demo/')).toContain('ronpicard.github.io')
    expect(safeDemoUrl('https://evil.example/demo/')).toBeNull()
  })
})

describe('safeArticleLinkHref', () => {
  const resolveAsset = (u: string) => (u.startsWith('resources/') ? `/${u}` : null)

  it('allows https links and resolves local assets', () => {
    expect(safeArticleLinkHref('https://example.com/a', resolveAsset)).toContain('https://example.com/a')
    expect(safeArticleLinkHref('resources/x.pdf', resolveAsset)).toBe('/resources/x.pdf')
  })

  it('rejects dangerous schemes and unknown relative paths', () => {
    expect(safeArticleLinkHref('javascript:alert(1)', resolveAsset)).toBeNull()
    expect(safeArticleLinkHref('../etc/passwd', resolveAsset)).toBeNull()
    expect(safeArticleLinkHref('//evil.example/file.pdf', resolveAsset)).toBeNull()
    expect(safeArticleLinkHref('/resources/file.pdf', resolveAsset)).toBeNull()
    expect(safeArticleLinkHref('resources/../file.pdf', resolveAsset)).toBeNull()
    expect(safeArticleLinkHref('  ', resolveAsset)).toBeNull()
  })
})
