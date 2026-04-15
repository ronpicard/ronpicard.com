import { useEffect, useState } from 'react'
import { markdownReadmeToSafeHtml } from '../lib/githubReadme'
import { safeHttpUrl } from '../lib/safeUrls'

type Props = {
  rawUrl: string
  /** Shown if fetch or render fails. */
  fallbackSummary: string | null
  /** Validated link for “view on GitHub” in error UI. */
  viewerUrl: string | null
}

export function DynamicGithubReadme({ rawUrl, fallbackSummary, viewerUrl }: Props) {
  const [phase, setPhase] = useState<'loading' | 'error' | 'ready'>('loading')
  const [html, setHtml] = useState<string | null>(null)

  useEffect(() => {
    const ac = new AbortController()
    setPhase('loading')
    setHtml(null)

    ;(async () => {
      try {
        const res = await fetch(rawUrl, {
          signal: ac.signal,
          headers: { Accept: 'text/plain' },
        })
        if (!res.ok) throw new Error(String(res.status))
        const md = await res.text()
        if (ac.signal.aborted) return
        const safe = markdownReadmeToSafeHtml(md, rawUrl)
        if (!safe) throw new Error('sanitize')
        setHtml(safe)
        setPhase('ready')
      } catch (e) {
        if (ac.signal.aborted) return
        setPhase('error')
      }
    })()

    return () => ac.abort()
  }, [rawUrl])

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
