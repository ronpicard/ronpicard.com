import { Link, useNavigate } from 'react-router-dom'
import { resolveAssetUrl } from '../lib/assetUrl'
import {
  safeArticleLinkHref,
  safeDemoUrl,
  safeGithubRepoUrl,
  safeHttpUrl,
} from '../lib/safeUrls'

export type ProjectListItem = {
  slug: string
  title: string
  date: string
  kind: 'app' | 'lesson' | 'post'
  imageUrl: string | null
  showDemo: boolean
  showCode: boolean
  /** External article URL from `extraLinks` (e.g. journal / news), if any. */
  articleUrl: string | null
  demoUrl: string | null
  repoUrl: string | null
  videoUrl: string | null
  pdfLinks: { label: string; href: string }[]
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
  const navigate = useNavigate()
  const thumbSrc = resolveAssetUrl(item.imageUrl)
  const articleHref = item.articleUrl ? safeHttpUrl(item.articleUrl) : null
  const demoHref = item.showDemo && item.demoUrl ? safeDemoUrl(item.demoUrl) : null
  const repoHref = item.showCode && item.repoUrl ? safeGithubRepoUrl(item.repoUrl) : null
  const videoHref = item.videoUrl ? safeHttpUrl(item.videoUrl) : null
  const to = `/blog/${item.slug}`

  function onCardActivate(e: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>) {
    const target = e.target as HTMLElement | null
    if (target?.closest('a,button')) return
    if ('key' in e) {
      if (e.key !== 'Enter' && e.key !== ' ') return
      e.preventDefault()
    }
    navigate(to)
  }
  return (
    <article
      className="project-card project-card--clickable"
      tabIndex={0}
      role="link"
      aria-label={`Open ${item.title}`}
      onClick={onCardActivate}
      onKeyDown={onCardActivate}
    >
      <div className={thumbSrc ? 'project-card__media' : 'project-card__media project-card__media--empty'}>
        {thumbSrc ? (
          <img src={thumbSrc} alt="" loading="lazy" decoding="async" />
        ) : null}
      </div>
      <div className="project-card__body">
        <div className="project-card__meta">
          <span className={`project-card__badge project-card__badge--${item.kind}`}>
            {item.kind === 'app' ? 'Web app' : item.kind === 'lesson' ? 'Lesson' : 'Article'}
          </span>
          <time dateTime={item.date}>{formatDate(item.date)}</time>
        </div>
        <h2 className="project-card__title">{item.title}</h2>
        <div className="project-card__actions">
          {articleHref ? (
            <a
              className="project-card__btn project-card__btn--article"
              href={articleHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              Article
            </a>
          ) : null}
          {demoHref ? (
            <a
              className="project-card__btn project-card__btn--code"
              href={demoHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              Demo
            </a>
          ) : null}
          {repoHref ? (
            <a
              className="project-card__btn project-card__btn--code"
              href={repoHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              Code
            </a>
          ) : null}
          {videoHref ? (
            <a
              className="project-card__btn project-card__btn--youtube"
              href={videoHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="project-card__btn__yt-icon" aria-hidden>
                <svg viewBox="0 0 24 24" width="16" height="16" focusable="false">
                  <path
                    fill="currentColor"
                    d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1 31.5 31.5 0 0 0 .5-5.8 31.5 31.5 0 0 0-.5-5.8zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"
                  />
                </svg>
              </span>
              YouTube
            </a>
          ) : null}
          {item.pdfLinks.map((p) => {
            const href = safeArticleLinkHref(p.href, resolveAssetUrl)
            if (!href) return null
            const label = p.label?.trim() || 'PDF'
            return (
              <a
                key={`${p.href}:${label}`}
                className="project-card__btn project-card__btn--code"
                href={href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {label.length > 22 ? `${label.slice(0, 20)}…` : label}
              </a>
            )
          })}
        </div>
        <Link className="project-card__link" to={to}>
          Read more
          <span className="project-card__arrow" aria-hidden>
            →
          </span>
        </Link>
      </div>
    </article>
  )
}
