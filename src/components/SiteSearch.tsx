import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { articles } from '../data/articles'

function normalize(s: string) {
  return s.toLowerCase().replace(/\s+/g, ' ').trim()
}

function matches(query: string, title: string, summary: string | null) {
  const q = normalize(query)
  if (!q) return true
  const hay = `${title} ${summary ?? ''}`.toLowerCase()
  return hay.includes(q)
}

export function SiteSearch() {
  const id = useId()
  const panelId = `${id}-panel`
  const location = useLocation()
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    if (!open) return []
    return articles.filter((a) => matches(query, a.title, a.summary)).slice(0, 24)
  }, [open, query])

  const close = useCallback(() => {
    setOpen(false)
    setQuery('')
  }, [])

  useEffect(() => {
    close()
  }, [location.pathname, close])

  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => inputRef.current?.focus(), 0)
    return () => window.clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!open) return
    function onDoc(e: MouseEvent) {
      const el = rootRef.current
      if (el && e.target instanceof Node && !el.contains(e.target)) close()
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open, close])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, close])

  return (
    <div className="site-search" ref={rootRef}>
      <button
        type="button"
        className="site-top-bar__icon site-search__toggle"
        aria-label="Search posts"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
          <path
            fill="currentColor"
            d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
          />
        </svg>
      </button>
      {open ? (
        <div className="site-search__panel" id={panelId} role="search">
          <label htmlFor={`${id}-q`} className="visually-hidden">
            Search articles
          </label>
          <input
            ref={inputRef}
            id={`${id}-q`}
            className="site-search__input"
            type="search"
            placeholder="Search articles…"
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <ul className="site-search__results" aria-label="Matching posts">
            {results.length === 0 ? (
              <li className="site-search__empty">
                {normalize(query) ? 'No matches.' : 'Type to search.'}
              </li>
            ) : (
              results.map((a) => (
                <li key={a.slug} className="site-search__item">
                  <Link className="site-search__link" to={`/blog/${a.slug}`} onClick={close}>
                    <span className="site-search__link-title">{a.title}</span>
                    <span className="site-search__link-kind">
                      {a.kind === 'app' ? 'App' : a.kind === 'lesson' ? 'Lesson' : 'Article'}
                    </span>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
