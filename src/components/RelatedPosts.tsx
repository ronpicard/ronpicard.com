import { Link } from 'react-router-dom'
import { getRelatedArticles, type Article } from '../data/articles'
import { formatArticleDate } from '../lib/articleDisplay'
import { getArticleTopic, topicPath } from '../../shared/articleTopics'
import { articlePath } from '../../shared/siteArticlesRouting'

type Props = {
  article: Article
}

/** Nearby posts from the same topic, plus a link to the whole topic hub. */
export function RelatedPosts({ article }: Props) {
  const topic = getArticleTopic(article.topic)
  const related = getRelatedArticles(article)
  if (!topic || related.length === 0) return null

  return (
    <section className="related-posts" aria-labelledby="related-posts-heading">
      <h2 id="related-posts-heading" className="related-posts__heading">
        More in {topic.label}
      </h2>
      <ul className="related-posts__list" role="list">
        {related.map((a) => (
          <li key={a.slug} className="related-posts__item">
            <Link className="related-posts__link" to={articlePath(a.slug)}>
              <span className="related-posts__title">{a.title}</span>
              <time className="related-posts__date" dateTime={a.date}>
                {formatArticleDate(a.date)}
              </time>
            </Link>
          </li>
        ))}
      </ul>
      <p className="related-posts__all">
        <Link to={topicPath(topic.slug)}>All {topic.label} posts →</Link>
      </p>
    </section>
  )
}
