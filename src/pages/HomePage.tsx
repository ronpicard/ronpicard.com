import { Seo } from '../components/Seo'
import { SiteTopBar } from '../components/SiteTopBar'
import { getArticleTitleList, ProjectCard } from '../features/articles'
import { homeSeoInput } from '../../shared/seoHead'

const list = getArticleTitleList()

/** Cards likely in the first viewport (grid is 1–3 columns) load eagerly. */
const PRIORITY_CARD_COUNT = 4

export default function HomePage() {
  return (
    <div className="page page--home">
      <Seo input={homeSeoInput()} />

      <SiteTopBar />
      <h1 className="header__tagline">Projects in AI, software &amp; aviation</h1>
      <p className="home-intro">
        I&apos;m Ron Picard, a 10X engineer. This is where I post personal projects like apps, games, free
        software engineering lessons, AI musings, and other topics I&apos;m interested in.
      </p>

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
