import { afterEach, describe, expect, it, vi } from 'vitest'
import {
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
  })
})

describe('safeGithubPagesUrl', () => {
  it('only allows ronpicard.github.io over https', () => {
    expect(safeGithubPagesUrl('https://ronpicard.github.io/demo/')).toContain('ronpicard.github.io')
    expect(safeGithubPagesUrl('https://evil.github.io/')).toBeNull()
    expect(safeGithubPagesUrl('http://ronpicard.github.io/')).toBeNull()
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
})

describe('safeGithubRepoUrl', () => {
  it('allows github.com repo URLs', () => {
    expect(safeGithubRepoUrl('https://github.com/ronpicard/clamav-antivirus-control-gui')).toContain(
      'github.com',
    )
  })
})

describe('safeHttpsEmbedUrl', () => {
  it('allowlists known embed hosts', () => {
    expect(safeHttpsEmbedUrl('https://www.youtube-nocookie.com/embed/x')).not.toBeNull()
    expect(safeHttpsEmbedUrl('https://ronpicard.github.io/demo/')).not.toBeNull()
    expect(safeHttpsEmbedUrl('https://evil.test/embed')).toBeNull()
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
  })

  it('requires https when PROD is set', () => {
    vi.stubEnv('PROD', true)
    expect(safeHttpUrl('http://example.com/')).toBeNull()
    expect(safeHttpUrl('https://example.com/')).toContain('https://example.com')
  })
})
