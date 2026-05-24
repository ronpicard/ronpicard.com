import { describe, expect, it } from 'vitest'
import { githubRepoPairKey, normalizeGithubRepoUrl } from './githubRepo'

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
