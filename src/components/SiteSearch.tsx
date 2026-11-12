import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { SEARCH_QUERY_MAX_LEN } from '../config/security'
import { articleKindShortLabel, articles } from '../features/articles'
import { articleMatchesSearch, normalizeSearchQuery } from '../lib/siteSearchQuery'
import { articlePath } from '../../shared/siteArticlesRouting'

/** URL query parameter the home page filters its post grid by. */
export const SEARCH_PARAM = 'q'

const MAX_RESULTS = 24

function SearchGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
      <path
        fill="currentColor"
        d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
      />
    </svg>
  )
}

/**
 * Keeps the home page's `?q=` parameter in step with the search box. The box
 * owns the text and the URL trails it; reading the value back from the URL
 * would drop keystrokes, because router updates land after the next key.
 */
function useHomeQuerySync(enabled: boolean, query: string, setQuery: (q: string) => void) {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlQuery = enabled ? (searchParams.get(SEARCH_PARAM) ?? '') : ''
  // Queries written to the URL that the router has not reported back yet.
  const pendingWrites = useRef<string[]>([])
  const lastUrlQuery = useRef(urlQuery)

  // Follow URL changes made elsewhere (such as "Show all posts" or the Home
  // link), but not the echoes of our own writes arriving after more typing.
  useEffect(() => {
    if (urlQuery === lastUrlQuery.current) return
    lastUrlQuery.current = urlQuery
    const echo = pendingWrites.current.indexOf(urlQuery)
    if (echo >= 0) {
      pendingWrites.current.splice(0, echo + 1)
      return
    }
    pendingWrites.current = []
    setQuery(urlQuery)
  }, [urlQuery, setQuery])

  useEffect(() => {
    if (!enabled) return
    const latest = pendingWrites.current.at(-1) ?? lastUrlQuery.current
    if (query === latest) return
    pendingWrites.current.push(query)
    setSearchParams(
      (params) => {
        const updated = new URLSearchParams(params)
        if (query) updated.set(SEARCH_PARAM, query)
        else updated.delete(SEARCH_PARAM)
        return updated
      },
      { replace: true, preventScrollReset: true },
    )
  }, [enabled, query, setSearchParams])

  return urlQuery
}

/**
 * Header search box. On the home page it filters the post grid live through
 * `?q=`; elsewhere it lists matching posts in a small dropdown. On phones it
 * collapses to an icon that opens the box over the header icons.
 */
export function SiteSearch() {
  const id = useId()
  const inputId = `${id}-q`
  const listboxId = `${id}-results`
  const location = useLocation()
  const navigate = useNavigate()
  const onHome = location.pathname === '/'
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState(() =>
    onHome ? (searchParams.get(SEARCH_PARAM) ?? '').slice(0, SEARCH_QUERY_MAX_LEN) : '',
  )
  const [listOpen, setListOpen] = useState(false)
  const [expanded, setExpanded] = useState(() => query !== '')
  const [activeIndex, setActiveIndex] = useState(-1)

  useHomeQuerySync(onHome, query, setQuery)

  // Picking a result keeps this header mounted when going from one article to
  // another, so reset the box whenever the page changes.
  const lastPath = useRef(location.pathname)
  useEffect(() => {
    if (location.pathname === lastPath.current) return
    lastPath.current = location.pathname
    setListOpen(false)
    setActiveIndex(-1)
    if (location.pathname !== '/') {
      setQuery('')
      setExpanded(false)
    }
  }, [location.pathname])

  const hasQuery = normalizeSearchQuery(query) !== ''
  const showList = !onHome && listOpen && hasQuery

  const results = useMemo(() => {
    if (!showList) return []
    return articles
      .filter((a) => articleMatchesSearch(query, a.title, a.summary))
      .slice(0, MAX_RESULTS)
  }, [showList, query])

  useEffect(() => {
    if (query) setExpanded(true)
  }, [query])

  useEffect(() => {
    if (!showList) return
    function onDoc(e: MouseEvent) {
      const el = rootRef.current
      if (el && e.target instanceof Node && !el.contains(e.target)) setListOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [showList])

  function updateQuery(next: string) {
    setQuery(next.slice(0, SEARCH_QUERY_MAX_LEN))
    setListOpen(true)
    setActiveIndex(-1)
  }

  function openFromToggle() {
    // The box is hidden on phones until expanded. Show it synchronously and
    // focus inside the tap, or iOS Safari will not raise the keyboard.
    flushSync(() => setExpanded(true))
    inputRef.current?.focus()
  }

  function onInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      event.preventDefault()
      if (query) updateQuery('')
      else {
        setExpanded(false)
        inputRef.current?.blur()
      }
      setListOpen(false)
      return
    }
    if (onHome) return
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (results.length === 0) return
      event.preventDefault()
      setListOpen(true)
      setActiveIndex((current) => {
        if (event.key === 'ArrowDown') return (current + 1) % results.length
        return current <= 0 ? results.length - 1 : current - 1
      })
      return
    }
    if (event.key === 'Enter') {
      const result = activeIndex >= 0 ? results[activeIndex] : undefined
      if (result) {
        event.preventDefault()
        void navigate(articlePath(result.slug))
      } else if (hasQuery) {
        // No highlighted result: show every match on the home page's grid.
        event.preventDefault()
        void navigate(`/?${new URLSearchParams({ [SEARCH_PARAM]: query.trim() })}`)
      }
    }
  }

  return (
    <div
      className="site-search"
      ref={rootRef}
      data-expanded={expanded ? 'true' : undefined}
    >
      <button
        type="button"
        className="site-top-bar__icon site-search__toggle"
        aria-label="Search posts"
        aria-expanded={expanded}
        aria-controls={inputId}
        onClick={openFromToggle}
      >
        <SearchGlyph />
      </button>
      <div className="site-search__box" role="search">
        <span className="site-search__glyph" aria-hidden>
          <SearchGlyph />
        </span>
        <input
          ref={inputRef}
          id={inputId}
          className="site-search__input"
          type="search"
          aria-label={onHome ? 'Search posts' : 'Search articles'}
          {...(onHome
            ? {}
            : {
                role: 'combobox',
                'aria-autocomplete': 'list' as const,
                'aria-expanded': showList,
                'aria-controls': listboxId,
                'aria-activedescendant':
                  activeIndex >= 0 && results[activeIndex]
                    ? `${id}-option-${activeIndex}`
                    : undefined,
              })}
          placeholder="Search"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
          value={query}
          onChange={(e) => updateQuery(e.target.value)}
          onFocus={() => setListOpen(true)}
          onBlur={() => {
            if (!query) setExpanded(false)
          }}
          onKeyDown={onInputKeyDown}
        />
      </div>
      {showList ? (
        <ul className="site-search__results" id={listboxId} role="listbox" aria-label="Matching posts">
          {results.length === 0 ? (
            <li className="site-search__empty">No matches.</li>
          ) : (
            results.map((a, index) => (
              <li key={a.slug} className="site-search__item" role="none">
                <Link
                  id={`${id}-option-${index}`}
                  className="site-search__link"
                  role="option"
                  aria-selected={index === activeIndex}
                  tabIndex={-1}
                  to={articlePath(a.slug)}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  <span className="site-search__link-title">{a.title}</span>
                  <span className="site-search__link-kind">{articleKindShortLabel(a.kind)}</span>
                </Link>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  )
}
