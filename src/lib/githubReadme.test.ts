import { describe, expect, it } from 'vitest'
import { README_MAX_BYTES } from '../config/security'
import { markdownReadmeToSafeHtml } from './githubReadme'

const RAW =
  'https://raw.githubusercontent.com/ronpicard/clamav-antivirus-control-gui/main/README.md'

describe('markdownReadmeToSafeHtml', () => {
  it('strips leading H1, sanitizes script, and adds GitHub intro', () => {
    const md = '# Title\n\nHello **world**\n\n<script>alert(1)</script>\n\n[rel](./docs/guide.md)'
    const html = markdownReadmeToSafeHtml(md, RAW)
    expect(html).toBeTruthy()
    expect(html).toContain('loaded dynamically from')
    expect(html).toContain('Hello')
    expect(html).toContain('<strong>world</strong>')
    expect(html).not.toContain('<script')
    expect(html).not.toContain('alert(1)')
    expect(html).toContain('github.com/ronpicard/clamav-antivirus-control-gui/blob/main/docs/guide.md')
  })

  it('strips javascript: markdown links', () => {
    const html = markdownReadmeToSafeHtml('[xss](javascript:alert(1))', RAW)
    expect(html).toBeTruthy()
    expect(html).not.toContain('javascript:')
  })

  it('rejects oversized markdown and bad raw URLs', () => {
    expect(markdownReadmeToSafeHtml('x'.repeat(README_MAX_BYTES + 1), RAW)).toBeNull()
    expect(markdownReadmeToSafeHtml('# hi', 'https://evil.example/README.md')).toBeNull()
  })
})
