import { useState } from 'react'
import { preload } from 'react-dom'
import { Link } from 'react-router-dom'
import type { ArticleExtraLink, ArticleKind } from '../data/articles'
import {
  articleKindBadgeClass,
  articleKindLabel,
  formatArticleDate,
} from '../lib/articleDisplay'
import { resolveAssetUrl, resolveThumbAssetUrl } from '../lib/assetUrl'
import { GitHubIcon, LinkBrandIcon, YouTubeIcon } from './BrandIcons'
import {
  safeArticleLinkHref,
  safeDemoUrl,
  safeGithubReleasesUrl,
  safeGithubRepoUrl,
  safeHttpUrl,
} from '../lib/safeUrls'

export type ProjectListItem = {
  slug: string
  title: string
  date: string
  kind: ArticleKind
  imageUrl: string | null
  showDemo: boolean
  showCode: boolean
  demoUrl: string | null
  repoUrl: string | null
  /** Latest GitHub release page, for repos that publish releases. */
  releasesUrl: string | null
  videoUrl: string | null
  /** Extra link buttons, the same ones the article page shows. */
  extraLinks: ArticleExtraLink[]
}

type Props = {
  item: ProjectListItem
  /** Above the fold: load eagerly at high priority instead of lazily. */
  priority?: boolean
}

export function ProjectCard({ item, priority = false }: Props) {
  const fullSrc = resolveAssetUrl(item.imageUrl)
  const [thumbFailed, setThumbFailed] = useState(false)
  const generatedThumb = thumbFailed ? null : resolveThumbAssetUrl(item.imageUrl)
  const thumbSrc = generatedThumb ?? fullSrc
  if (priority && thumbSrc) {
    preload(thumbSrc, { as: 'image', fetchPriority: 'high' })
  }
  const demoHref = item.showDemo && item.demoUrl ? safeDemoUrl(item.demoUrl) : null
  const repoHref = item.showCode && item.repoUrl ? safeGithubRepoUrl(item.repoUrl) : null
  const releasesHref = safeGithubReleasesUrl(item.releasesUrl)
  const videoHref = item.videoUrl ? safeHttpUrl(item.videoUrl) : null
  const to = `/blog/${item.slug}`

  return (
    <article className="project-card" data-project={item.slug}>
      <Link className="project-card__overlay-link" to={to} aria-label={`Open ${item.title}`} />
      <div className={thumbSrc ? 'project-card__media' : 'project-card__media project-card__media--empty'}>
        {thumbSrc ? (
          <img
            src={thumbSrc}
            alt=""
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : undefined}
            decoding="async"
            onError={generatedThumb ? () => setThumbFailed(true) : undefined}
          />
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
          {demoHref ? (
            <a
              className="project-card__btn project-card__btn--code"
              href={demoHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              <GitHubIcon className="btn-logo" size={14} />
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
              <GitHubIcon className="btn-logo" size={14} />
              Code
            </a>
          ) : null}
          {releasesHref ? (
            <a
              className="project-card__btn project-card__btn--code"
              href={releasesHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              <GitHubIcon className="btn-logo" size={14} />
              Releases
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
                <YouTubeIcon size={16} />
              </span>
              YouTube
            </a>
          ) : null}
          {item.extraLinks.map((link) => {
            const href = safeArticleLinkHref(link.href, resolveAssetUrl)
            if (!href) return null
            return (
              <a
                key={`${link.href}:${link.label}`}
                className={
                  link.articleStyle
                    ? 'project-card__btn project-card__btn--article'
                    : 'project-card__btn project-card__btn--code'
                }
                href={href}
                target="_blank"
                rel="noopener noreferrer"
              >
                <LinkBrandIcon className="btn-logo" href={href} size={14} />
                {link.label.length > 22 ? `${link.label.slice(0, 20)}…` : link.label}
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
