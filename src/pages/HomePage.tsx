import { Seo } from '../components/Seo'
import { SiteTopBar } from '../components/SiteTopBar'
import { getArticleTitleList, ProjectCard } from '../features/articles'
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE } from '../lib/siteMeta'

const list = getArticleTitleList()

/** Cards likely in the first viewport (grid is 1–3 columns) load eagerly. */
const PRIORITY_CARD_COUNT = 4

export default function HomePage() {
  return (
    <div className="page page--home">
      <Seo
        title={DEFAULT_TITLE}
        description={DEFAULT_DESCRIPTION}
        path="/"
        ogImage="resources/82f3c8eae802c3.jpg"
      />

      <SiteTopBar />
      <h1 className="header__tagline">My projects</h1>

      <main id="main-content" className="main" tabIndex={-1}>
        <ul className="project-list" role="list">
          {list.map((item, index) => (
            <li key={item.slug} className="project-list__item">
              <ProjectCard item={item} priority={index < PRIORITY_CARD_COUNT} />
            </li>
          ))}
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
