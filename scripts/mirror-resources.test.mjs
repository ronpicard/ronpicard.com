import { describe, expect, it } from 'vitest'
import {
  detectAssetExtension,
  shouldMirrorAbsoluteUrl,
  validateAssetUrl,
} from './lib/assetSafety.mjs'

describe('validateAssetUrl', () => {
  it('allows known asset hosts with only expected query parameters', () => {
    expect(() =>
      validateAssetUrl(
        new URL('https://static1.squarespace.com/static/example/image.png?format=1500w'),
      ),
    ).not.toThrow()
    expect(() =>
      validateAssetUrl(new URL('https://proceedings.neurips.cc/paper/example.pdf')),
    ).not.toThrow()
  })

  it('rejects unknown hosts, credentials, and unexpected query parameters', () => {
    expect(() => validateAssetUrl(new URL('https://evil.example/image.png'))).toThrow(
      'host is not allowed',
    )
    expect(() =>
      validateAssetUrl(new URL('https://user@static1.squarespace.com/image.png')),
    ).toThrow('credentials')
    expect(() =>
      validateAssetUrl(new URL('https://static1.squarespace.com/image.png?token=secret')),
    ).toThrow('Unexpected asset query parameter')
    expect(() =>
      validateAssetUrl(new URL('https://proceedings.neurips.cc/paper.pdf?download=1')),
    ).toThrow('query parameters are not allowed')
  })
})

describe('shouldMirrorAbsoluteUrl', () => {
  it('permits passive allowlisted assets and rejects SVG or disallowed sources', () => {
    expect(
      shouldMirrorAbsoluteUrl('https://static1.squarespace.com/static/example/image.png'),
    ).toBe(true)
    expect(
      shouldMirrorAbsoluteUrl('https://static1.squarespace.com/static/example/image.svg'),
    ).toBe(false)
    expect(shouldMirrorAbsoluteUrl('https://evil.example/image.png')).toBe(false)
  })
})

describe('detectAssetExtension', () => {
  it('recognizes passive file signatures and rejects active or mislabeled content', () => {
    expect(
      detectAssetExtension(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      ),
    ).toBe('.png')
    expect(detectAssetExtension(Buffer.from([0xff, 0xd8]))).toBe('.jpg')
    expect(detectAssetExtension(Buffer.from('GIF89a'))).toBe('.gif')
    expect(detectAssetExtension(Buffer.from('RIFF0000WEBP'))).toBe('.webp')
    expect(detectAssetExtension(Buffer.from([0, 0, 0, 0, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66]))).toBe(
      '.avif',
    )
    expect(detectAssetExtension(Buffer.from([0x00, 0x00, 0x01, 0x00]))).toBe('.ico')
    expect(detectAssetExtension(Buffer.from('BM'))).toBe('.bmp')
    expect(detectAssetExtension(Buffer.from('%PDF-1.7'))).toBe('.pdf')
    expect(detectAssetExtension(Buffer.from([0x50, 0x4b, 0x03, 0x04]))).toBe('.zip')
    expect(detectAssetExtension(Buffer.from('<svg><script>alert(1)</script></svg>'))).toBeNull()
    expect(detectAssetExtension(Buffer.from('<html>not an image</html>'))).toBeNull()
  })
})
