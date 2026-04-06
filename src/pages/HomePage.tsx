import { homeJsonLd, Seo } from '../components/Seo'
import { SiteTopBar } from '../components/SiteTopBar'
import { ProjectCard } from '../components/ProjectCard'
import { getArticleTitleList } from '../data/articles'
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE } from '../lib/siteMeta'

const list = getArticleTitleList()

export default function HomePage() {
  return (
    <div className="page page--home">
      <Seo
        title={DEFAULT_TITLE}
        description={DEFAULT_DESCRIPTION}
        path="/"
        jsonLd={homeJsonLd()}
      />
      <div className="page__glow page__glow--one" aria-hidden />
      <div className="page__glow page__glow--two" aria-hidden />

      <SiteTopBar />
      <p className="header__tagline">Projects I think are cool.</p>

      <main className="main">
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
