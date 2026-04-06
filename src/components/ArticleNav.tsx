import { Link } from 'react-router-dom'
import type { Article } from '../data/articles'
import { getArticle } from '../data/articles'

type Props = {
  article: Article
}

function navLabel(slug: string | null, which: 'prev' | 'next') {
  if (!slug) return null
  const a = getArticle(slug)
  if (!a) return null
  const word = which === 'prev' ? 'Previous' : 'Next'
  return { word, title: a.title, slug }
}

export function ArticleNav({ article }: Props) {
  const prev = navLabel(article.prevSlug, 'prev')
  const next = navLabel(article.nextSlug, 'next')

  if (!prev && !next) return null

  return (
    <nav className="article-nav" aria-label="Adjacent posts">
      <div className="article-nav__half">
        {prev ? (
          <Link className="article-nav__link" to={`/blog/${prev.slug}`}>
            <span className="article-nav__dir">{prev.word}</span>
            <span className="article-nav__title">{prev.title}</span>
          </Link>
        ) : null}
      </div>
      <div className="article-nav__half article-nav__half--end">
        {next ? (
          <Link className="article-nav__link article-nav__link--end" to={`/blog/${next.slug}`}>
            <span className="article-nav__dir">{next.word}</span>
            <span className="article-nav__title">{next.title}</span>
          </Link>
        ) : null}
      </div>
    </nav>
  )
}
