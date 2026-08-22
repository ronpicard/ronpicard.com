import { Link } from 'react-router-dom'
import {
  articleKindBadgeClass,
  articleKindLabel,
  formatArticleDate,
} from '../lib/articleDisplay'
import { resolveAssetUrl } from '../lib/assetUrl'
import { YoutubeIcon } from './YoutubeIcon'
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

export function ProjectCard({ item }: Props) {
  const thumbSrc = resolveAssetUrl(item.imageUrl)
  const articleHref = item.articleUrl ? safeHttpUrl(item.articleUrl) : null
  const demoHref = item.showDemo && item.demoUrl ? safeDemoUrl(item.demoUrl) : null
  const repoHref = item.showCode && item.repoUrl ? safeGithubRepoUrl(item.repoUrl) : null
  const videoHref = item.videoUrl ? safeHttpUrl(item.videoUrl) : null
  const to = `/blog/${item.slug}`

  return (
    <article className="project-card">
      <Link className="project-card__overlay-link" to={to} aria-label={`Open ${item.title}`} />
      <div className={thumbSrc ? 'project-card__media' : 'project-card__media project-card__media--empty'}>
        {thumbSrc ? (
          <img src={thumbSrc} alt="" loading="lazy" decoding="async" />
        ) : null}
      </div>
      <div className="project-card__body">
        <div className="project-card__meta">
          <span className={`project-card__badge ${articleKindBadgeClass(item.kind)}`}>
            {articleKindLabel(item.kind)}
          </span>
          <time dateTime={item.date}>{formatArticleDate(item.date)}</time>
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
                <YoutubeIcon size={16} />
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
        <span className="project-card__link" aria-hidden>
          Read more
          <span className="project-card__arrow" aria-hidden>
            →
          </span>
        </span>
      </div>
    </article>
  )
}
