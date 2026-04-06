import { Link } from 'react-router-dom'
import { resolveAssetUrl } from '../lib/assetUrl'

export type ProjectListItem = {
  slug: string
  title: string
  date: string
  kind: 'app' | 'lesson' | 'post'
  imageUrl: string | null
  showDemo: boolean
  showCode: boolean
  demoUrl: string | null
  repoUrl: string | null
}

type Props = {
  item: ProjectListItem
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso + 'T12:00:00'))
}

export function ProjectCard({ item }: Props) {
  const thumbSrc = resolveAssetUrl(item.imageUrl)
  return (
    <article className="project-card">
      {thumbSrc ? (
        <div className="project-card__media">
          <img src={thumbSrc} alt="" loading="lazy" decoding="async" />
        </div>
      ) : null}
      <div className="project-card__body">
        <div className="project-card__meta">
          <span className={`project-card__badge project-card__badge--${item.kind}`}>
            {item.kind === 'app' ? 'Web app' : item.kind === 'lesson' ? 'Lesson' : 'Article'}
          </span>
          <time dateTime={item.date}>{formatDate(item.date)}</time>
        </div>
        <h2 className="project-card__title">{item.title}</h2>
        {(item.showDemo || item.showCode) && (
          <div className="project-card__actions">
            {item.showDemo && item.demoUrl ? (
              <a
                className="project-card__btn project-card__btn--demo"
                href={item.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Demo
              </a>
            ) : null}
            {item.showCode && item.repoUrl ? (
              <a
                className="project-card__btn project-card__btn--code"
                href={item.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Code
              </a>
            ) : null}
          </div>
        )}
        <Link className="project-card__link" to={`/blog/${item.slug}`}>
          Read more
          <span className="project-card__arrow" aria-hidden>
            →
          </span>
        </Link>
      </div>
    </article>
  )
}
