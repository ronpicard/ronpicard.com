import { useMemo } from 'react'
import { Seo } from '../components/Seo'
import { SiteTopBar } from '../components/SiteTopBar'
import { SEARCH_PARAM } from '../components/SiteSearch'
import { useSearchParams } from 'react-router-dom'
import { articles, getArticleTitleList, ProjectCard } from '../features/articles'
import { articleMatchesSearch, normalizeSearchQuery } from '../lib/siteSearchQuery'
import { homeSeoInput } from '../../shared/seoHead'

const list = getArticleTitleList()

/** Cards likely in the first viewport (grid is 1–3 columns) load eagerly. */
const PRIORITY_CARD_COUNT = 4

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  // The header search box writes the query; the grid follows it.
  const query = searchParams.get(SEARCH_PARAM) ?? ''
  const filtering = normalizeSearchQuery(query) !== ''

  // Match against the full summaries, as the header search does; the card list truncates them.
  const shown = useMemo(() => {
    const matching = new Set(
      articles.filter((a) => articleMatchesSearch(query, a.title, a.summary)).map((a) => a.slug),
    )
    const matches = list.filter((item) => matching.has(item.slug))
    // Pinned posts lead the unfiltered grid; search results keep site order.
    if (filtering) return matches
    return [...matches.filter((item) => item.pinned), ...matches.filter((item) => !item.pinned)]
  }, [query, filtering])

  function showAll() {
    setSearchParams(
      (params) => {
        const updated = new URLSearchParams(params)
        updated.delete(SEARCH_PARAM)
        return updated
      },
      { replace: true, preventScrollReset: true },
    )
  }

  return (
    <div className="page page--home">
      <Seo input={homeSeoInput()} />

      <SiteTopBar />
      <h1 className="header__tagline">Projects in AI, software &amp; aviation</h1>
      <p className="home-intro">
        I&apos;m Ron Picard, a 10X engineer. This is where I post my projects like apps, games, free
        software engineering lessons, AI musings, and other topics I&apos;m interested in.
      </p>

      <main id="main-content" className="main" tabIndex={-1}>
        <p className="post-filter__status" role="status">
          {filtering ? `${shown.length} of ${list.length} posts match “${query.trim()}”` : ''}
        </p>
        {shown.length === 0 ? (
          <p className="post-filter__empty">
            No posts match that.{' '}
            <button type="button" className="post-filter__clear" onClick={showAll}>
              Show all posts
            </button>
          </p>
        ) : null}
        <ul className="project-list" role="list">
          {shown.map((item, index) => {
            const featured = !filtering && item.pinned === true
            return (
              <li
                key={item.slug}
                className={featured ? 'project-list__item project-list__item--pinned' : 'project-list__item'}
              >
                {featured ? (
                  <div className="pinned-feature__head">
                    <p className="pinned-feature__eyebrow">Featured</p>
                    <h2 className="pinned-feature__title">{item.pinnedTitle ?? item.title}</h2>
                  </div>
                ) : null}
                <ProjectCard item={item} priority={index < PRIORITY_CARD_COUNT} featured={featured} />
              </li>
            )
          })}
        </ul>
      </main>

      <footer className="footer">
        <p>
          Static site —{' '}
          <a
            href="https://github.com/ronpicard/ronpicard.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            source
          </a>
        </p>
      </footer>
    </div>
  )
}
