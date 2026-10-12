import { useEffect, useState } from 'react'
import { resolveAssetUrl } from '../lib/assetUrl'
import { fetchArticleBodyHtml } from '../lib/fetchArticleBody'
import { primedArticleBody } from '../lib/primedArticleBodies'
import { prepareArticleBodyHtml } from '../lib/sanitizeArticleHtml'

type Props = {
  bodyPath: string
  fallbackSummary: string | null
}

function primedSafeHtml(bodyPath: string): string | null {
  const raw = primedArticleBody(bodyPath)
  return raw ? prepareArticleBodyHtml(raw) : null
}

export function DynamicArticleBody({ bodyPath, fallbackSummary }: Props) {
  // A primed body (prerender, or hydrating its output) renders at once, unfetched.
  const [html, setHtml] = useState<string | null>(() => primedSafeHtml(bodyPath))
  const [phase, setPhase] = useState<'loading' | 'error' | 'ready'>(() =>
    html ? 'ready' : 'loading',
  )

  useEffect(() => {
    const primed = primedSafeHtml(bodyPath)
    if (primed) {
      setHtml(primed)
      setPhase('ready')
      return
    }
    const controller = new AbortController()
    const bodyUrl = resolveAssetUrl(bodyPath)
    setPhase('loading')
    setHtml(null)

    if (!bodyUrl) {
      setPhase('error')
      return () => controller.abort()
    }

    void fetchArticleBodyHtml(bodyUrl, controller.signal)
      .then((body) => {
        if (controller.signal.aborted) return
        const safeHtml = prepareArticleBodyHtml(body)
        if (!safeHtml) throw new Error('sanitize')
        setHtml(safeHtml)
        setPhase('ready')
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          console.error('Could not load article body', error)
          setPhase('error')
        }
      })

    return () => controller.abort()
  }, [bodyPath])

  if (phase === 'loading') {
    return (
      <div className="article-readme-dynamic" aria-busy="true" aria-live="polite">
        <div className="article-readme-loading__row">
          <span className="article-readme-loading__spinner" aria-hidden />
          <span className="article-readme-loading__label">Loading article…</span>
        </div>
      </div>
    )
  }

  if (phase === 'error' || !html) {
    return fallbackSummary ? (
      <p className="article-summary-plain">Could not load the full article. {fallbackSummary}</p>
    ) : (
      <p className="article-summary-plain">Could not load the full article.</p>
    )
  }

  return (
    <div
      className="article-prose"
      data-body-path={bodyPath}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
