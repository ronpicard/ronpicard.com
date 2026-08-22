import { homeJsonLd, Seo } from '../components/Seo'
import { SiteTopBar } from '../components/SiteTopBar'
import { getArticleTitleList, ProjectCard } from '../features/articles'
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE } from '../lib/siteMeta'

const list = getArticleTitleList()

export default function HomePage() {
  return (
    <div className="page page--home">
      <Seo
        title={DEFAULT_TITLE}
        description={DEFAULT_DESCRIPTION}
        path="/"
        ogImage="resources/82f3c8eae802c3.jpg"
        jsonLd={homeJsonLd()}
      />

      <SiteTopBar />
      <h1 className="header__tagline">My projects</h1>

      <main id="main-content" className="main" tabIndex={-1}>
        <ul className="project-list" role="list">
          {list.map((item) => (
            <li key={item.slug} className="project-list__item">
              <ProjectCard item={item} />
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
