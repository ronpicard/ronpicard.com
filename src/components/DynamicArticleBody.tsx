import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { playAnimatedFigures } from '../lib/animatedFigures'
import { outlineArticleHtml, showsTableOfContents, type ArticleOutline } from '../lib/articleToc'
import { resolveAssetUrl } from '../lib/assetUrl'
import { fetchArticleBodyHtml } from '../lib/fetchArticleBody'
import { primedArticleBody } from '../lib/primedArticleBodies'
import { prepareArticleBodyHtml } from '../lib/sanitizeArticleHtml'

type Props = {
  bodyPath: string
  fallbackSummary: string | null
}

/** Jumps to a section without a router navigation, keeping the address shareable. */
function jumpToSection(event: MouseEvent<HTMLAnchorElement>, id: string) {
  const target = document.getElementById(id)
  if (!target) return
  event.preventDefault()
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  window.history.replaceState(window.history.state, '', `#${id}`)
}

function TableOfContents({ outline }: { outline: ArticleOutline }) {
  return (
    <nav className="article-toc" aria-labelledby="article-toc-heading">
      <p className="article-toc__heading" id="article-toc-heading">
        On this page <span className="article-toc__time">· {outline.minutes} min read</span>
      </p>
      <ol className="article-toc__list">
        {outline.toc.map((entry) => (
          <li key={entry.id}>
            <a href={`#${entry.id}`} onClick={(event) => jumpToSection(event, entry.id)}>
              {entry.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
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
  const proseRef = useRef<HTMLDivElement>(null)
  const outline = useMemo(() => (html ? outlineArticleHtml(html) : null), [html])

  useEffect(() => {
    const prose = proseRef.current
    if (phase !== 'ready' || !prose) return
    return playAnimatedFigures(prose)
  }, [phase, html])

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
    <>
      {outline && showsTableOfContents(outline) ? <TableOfContents outline={outline} /> : null}
      <div
        ref={proseRef}
        className="article-prose"
        data-body-path={bodyPath}
        dangerouslySetInnerHTML={{ __html: outline?.html ?? html }}
      />
    </>
  )
}
