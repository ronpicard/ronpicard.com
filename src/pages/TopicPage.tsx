import { Link, Navigate, useParams } from 'react-router-dom'
import { ProjectCard } from '../components/ProjectCard'
import { Seo } from '../components/Seo'
import { SiteTopBar } from '../components/SiteTopBar'
import { getArticlesByTopic, getArticleTitleList } from '../data/articles'
import { getArticleTopic } from '../../shared/articleTopics'
import { topicSeoInput } from '../../shared/seoHead'

/** Same eager-load budget as the home grid. */
const PRIORITY_CARD_COUNT = 4

/** A topic hub: intro text and the cards of every post in the topic. */
export default function TopicPage() {
  const { topic: topicSlug } = useParams<{ topic: string }>()
  const topic = getArticleTopic(topicSlug)
  if (!topic) {
    return <Navigate to="/" replace />
  }
  const list = getArticleTitleList(getArticlesByTopic(topic.slug))

  return (
    <div className="page page--home page--topic">
      <Seo input={topicSeoInput(topic, list)} />

      <SiteTopBar />
      <Link className="article-back" to="/">
        ← Home
      </Link>
      <h1 className="header__tagline">{topic.label}</h1>
      <p className="home-intro">{topic.intro}</p>

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
          <Link to="/">All posts</Link>
        </p>
      </footer>
    </div>
  )
}
