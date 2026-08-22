import { describe, expect, it } from 'vitest'
import {
  githubRepoPairKey,
  normalizeGithubRepoUrl,
  parseGithubRepoUrl,
} from './githubRepo'

describe('githubRepoPairKey', () => {
  it('returns owner/repo lowercase', () => {
    expect(githubRepoPairKey('https://github.com/RonPicard/Foo')).toBe('ronpicard/foo')
  })
})

describe('normalizeGithubRepoUrl', () => {
  it('returns canonical repo root', () => {
    expect(normalizeGithubRepoUrl('https://github.com/o/r/blob/main/README.md')).toBe(
      'https://github.com/o/r',
    )
  })
})

describe('parseGithubRepoUrl', () => {
  it('validates protocol, credentials, host, query, and path segments', () => {
    expect(parseGithubRepoUrl('https://github.com/o/r')?.url).toBe('https://github.com/o/r')
    expect(parseGithubRepoUrl('http://github.com/o/r')).toBeNull()
    expect(parseGithubRepoUrl('https://user@github.com/o/r')).toBeNull()
    expect(parseGithubRepoUrl('https://gitlab.com/o/r')).toBeNull()
    expect(parseGithubRepoUrl('https://github.com/o/r?token=x')).toBeNull()
    expect(parseGithubRepoUrl('https://github.com/bad%20owner/r')).toBeNull()
  })
})
