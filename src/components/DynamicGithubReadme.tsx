import { useEffect, useState } from 'react'
import { README_FETCH_TIMEOUT_MS, README_MAX_BYTES } from '../config/security'
import { fetchGithubReadmeText } from '../lib/fetchGithubReadme'
import { markdownReadmeToSafeHtml } from '../lib/githubReadme'
import { readBoundedResponseText } from '../lib/readBoundedResponseText'
import { safeHttpUrl } from '../lib/safeUrls'

type Props = {
  rawUrl: string
  /** Shown if fetch or render fails. */
  fallbackSummary: string | null
  /** Validated link for “view on GitHub” in error UI. */
  viewerUrl: string | null
  /** Same-origin snapshot (mirror-readmes) used when the live fetch fails. */
  snapshotUrl?: string | null
}

async function fetchReadmeSnapshotText(snapshotUrl: string, signal: AbortSignal): Promise<string> {
  const res = await fetch(snapshotUrl, {
    method: 'GET',
    signal: AbortSignal.any([signal, AbortSignal.timeout(README_FETCH_TIMEOUT_MS)]),
    credentials: 'omit',
  })
  if (!res.ok) throw new Error(`README snapshot request failed (http-${res.status})`)
  return readBoundedResponseText(res, README_MAX_BYTES, 'README snapshot')
}

export function DynamicGithubReadme({ rawUrl, fallbackSummary, viewerUrl, snapshotUrl }: Props) {
  const [phase, setPhase] = useState<'loading' | 'error' | 'ready'>('loading')
  const [html, setHtml] = useState<string | null>(null)

  useEffect(() => {
    const ac = new AbortController()
    setPhase('loading')
    setHtml(null)

    const render = (md: string) => {
      const safe = markdownReadmeToSafeHtml(md, rawUrl)
      if (!safe) throw new Error('sanitize')
      setHtml(safe)
      setPhase('ready')
    }

    ;(async () => {
      try {
        const md = await fetchGithubReadmeText(rawUrl, ac.signal)
        if (ac.signal.aborted) return
        render(md)
      } catch (error: unknown) {
        if (ac.signal.aborted) return
        console.error('Could not load GitHub README', error)
        try {
          if (!snapshotUrl) throw error
          const md = await fetchReadmeSnapshotText(snapshotUrl, ac.signal)
          if (ac.signal.aborted) return
          render(md)
        } catch {
          if (ac.signal.aborted) return
          setPhase('error')
        }
      }
    })()

    return () => ac.abort()
  }, [rawUrl, snapshotUrl])

  const viewHref = viewerUrl ? safeHttpUrl(viewerUrl) : null

  if (phase === 'loading') {
    return (
      <div className="article-readme-dynamic" aria-busy="true" aria-live="polite">
        <div className="article-readme-loading">
          <div className="article-readme-loading__row">
            <span className="article-readme-loading__spinner" aria-hidden />
            <div className="article-readme-loading__text">
              <span className="article-readme-loading__label">Loading README from GitHub…</span>
              <span className="article-readme-loading__hint">
                This section is loaded dynamically from the repository, so it usually takes about a second
                to appear.
              </span>
            </div>
          </div>
          <div className="article-readme-skeleton" aria-hidden>
            <div className="article-readme-skeleton__line article-readme-skeleton__line--title" />
            <div className="article-readme-skeleton__line" />
            <div className="article-readme-skeleton__line" />
            <div className="article-readme-skeleton__line article-readme-skeleton__line--short" />
            <div className="article-readme-skeleton__line article-readme-skeleton__line--mid" />
            <div className="article-readme-skeleton__line" />
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'error' || !html) {
    return (
      <div className="article-readme-dynamic">
        <p className="article-readme-dynamic__error">
          Could not load the README from GitHub.
          {viewHref ? (
            <>
              {' '}
              <a href={viewHref} target="_blank" rel="noopener noreferrer">
                Open it on GitHub
              </a>
              .
            </>
          ) : null}
        </p>
        {fallbackSummary ? <p className="article-summary-plain">{fallbackSummary}</p> : null}
      </div>
    )
  }

  return (
    <div className="article-readme-dynamic">
      <div className="article-prose" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
