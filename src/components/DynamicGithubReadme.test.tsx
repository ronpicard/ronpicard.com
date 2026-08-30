// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DynamicGithubReadme } from './DynamicGithubReadme'

const RAW =
  'https://raw.githubusercontent.com/ronpicard/clamav-antivirus-control-gui/main/README.md'
const VIEWER =
  'https://github.com/ronpicard/clamav-antivirus-control-gui/blob/main/README.md'

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
    .IS_REACT_ACT_ENVIRONMENT = true
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

async function flushEffects() {
  await act(async () => {
    await Promise.resolve()
    await Promise.resolve()
  })
}

describe('DynamicGithubReadme', () => {
  it('shows loading state and then sanitized README HTML', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response('# Title\n\n**Mocked README**\n\n<script>alert(1)</script>\n', {
          headers: { 'content-type': 'text/plain' },
        }),
      ),
    )

    act(() => {
      root.render(
        <DynamicGithubReadme
          rawUrl={RAW}
          fallbackSummary="Summary"
          viewerUrl={VIEWER}
        />,
      )
    })
    expect(container.textContent).toContain('Loading README from GitHub')

    await flushEffects()

    expect(container.textContent).toContain('Mocked README')
    expect(container.textContent).not.toContain('Title')
    expect(container.querySelector('script')).toBeNull()
    expect(container.querySelector('.article-prose')).not.toBeNull()
  })

  it('shows the fallback summary and a safe GitHub link when loading fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubGlobal('fetch', vi.fn(async () => new Response('fail', { status: 500 })))

    act(() => {
      root.render(
        <DynamicGithubReadme
          rawUrl={RAW}
          fallbackSummary="Fallback summary"
          viewerUrl={VIEWER}
        />,
      )
    })
    await flushEffects()

    expect(container.textContent).toContain('Could not load the README from GitHub.')
    expect(container.textContent).toContain('Fallback summary')
    const link = container.querySelector('a')
    expect(link?.getAttribute('href')).toBe(VIEWER)
    expect(link?.getAttribute('rel')).toContain('noopener')
  })

  it('renders the local snapshot when the live GitHub fetch fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const SNAPSHOT = '/readme-snapshots/clamav-antivirus-control-gui.md'
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input)
        if (url === SNAPSHOT) {
          return new Response('# Title\n\n**Snapshot README**\n', {
            headers: { 'content-type': 'text/markdown' },
          })
        }
        return new Response('fail', { status: 500 })
      }),
    )

    act(() => {
      root.render(
        <DynamicGithubReadme
          rawUrl={RAW}
          fallbackSummary="Summary"
          viewerUrl={VIEWER}
          snapshotUrl={SNAPSHOT}
        />,
      )
    })
    await flushEffects()

    expect(container.textContent).toContain('Snapshot README')
    expect(container.textContent).not.toContain('Could not load the README')
  })
})
