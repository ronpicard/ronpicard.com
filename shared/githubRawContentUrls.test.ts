import { describe, expect, it } from 'vitest'
import {
  githubBlobDirectoryBaseFromRawUrl,
  githubBlobViewerUrlFromRawUrl,
  parseRawGithubContentUrl,
} from './githubRawContentUrls'

const RAW =
  'https://raw.githubusercontent.com/ronpicard/clamav-antivirus-control-gui/main/README.md'

describe('parseRawGithubContentUrl', () => {
  it('parses owner, repo, branch, and paths', () => {
    expect(parseRawGithubContentUrl(RAW)).toEqual({
      owner: 'ronpicard',
      repo: 'clamav-antivirus-control-gui',
      branch: 'main',
      blobDirBase: 'https://github.com/ronpicard/clamav-antivirus-control-gui/blob/main/',
      viewerUrl:
        'https://github.com/ronpicard/clamav-antivirus-control-gui/blob/main/README.md',
    })
  })

  it('rejects non-raw hosts', () => {
    expect(parseRawGithubContentUrl('https://github.com/ronpicard/repo/blob/main/README.md')).toBeNull()
  })
})

describe('githubBlobDirectoryBaseFromRawUrl', () => {
  it('resolves nested file directories', () => {
    const raw =
      'https://raw.githubusercontent.com/o/r/main/docs/guide.md'
    expect(githubBlobDirectoryBaseFromRawUrl(raw)).toBe('https://github.com/o/r/blob/main/docs/')
  })
})

describe('githubBlobViewerUrlFromRawUrl', () => {
  it('returns the blob viewer URL', () => {
    expect(githubBlobViewerUrlFromRawUrl(RAW)).toBe(
      'https://github.com/ronpicard/clamav-antivirus-control-gui/blob/main/README.md',
    )
  })
})
