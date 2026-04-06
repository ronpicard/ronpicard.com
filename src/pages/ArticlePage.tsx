import { Link, Navigate, useParams } from 'react-router-dom'
import { ArticleNav } from '../components/ArticleNav'
import { LessonOutline } from '../components/LessonOutline'
import { articleJsonLd, Seo } from '../components/Seo'
import { SiteTopBar } from '../components/SiteTopBar'
import {
  filterExtraLinks,
  getArticle,
  showCodeButton,
  showDemoButton,
  youtubeWatchUrl,
} from '../data/articles'
import { resolveAssetUrl, resolveResourcePathsInHtml } from '../lib/assetUrl'
import { DEFAULT_TITLE, truncateMetaDescription } from '../lib/siteMeta'

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso + 'T12:00:00'))
}

function badgeClass(kind: string) {
  if (kind === 'app') return 'project-card__badge--app'
  if (kind === 'lesson') return 'project-card__badge--lesson'
  return 'project-card__badge--post'
}

function badgeLabel(kind: string) {
  if (kind === 'app') return 'Web app'
  if (kind === 'lesson') return 'Lesson'
  return 'Article'
}

function stripQuery(url: string) {
  return url.split('?')[0]
}

function displayExtraLinkLabel(label: string): string {
  const t = label.trim()
  if (/^view paper$/i.test(t)) return 'Paper'
  return label
}

export default function ArticlePage() {
  const { slug } = useParams<{ slug: string }>()
  const article = slug ? getArticle(slug) : undefined

  if (!article) {
    return <Navigate to="/" replace />
  }

  const cleanGithubEmbed = article.githubEmbed ? stripQuery(article.githubEmbed) : null
  const iframeSrc = cleanGithubEmbed
    ? cleanGithubEmbed.endsWith('/')
      ? cleanGithubEmbed
      : `${cleanGithubEmbed}/`
    : null

  const extras = filterExtraLinks(article)
  const hasDemo = showDemoButton(article)
  const hasCode = showCodeButton(article)
  const videoUrl = youtubeWatchUrl(article.youtubeId)
  const proseHtml = resolveResourcePathsInHtml(article.bodyHtml)
  const heroSrc = resolveAssetUrl(article.articleHeroUrl)
  const path = `/blog/${article.slug}`
  const metaDesc =
    article.summary?.replace(/&nbsp;/gi, ' ').replace(/<[^>]+>/g, '') ||
    `${article.title} — ${DEFAULT_TITLE}`
  const seoTitle = `${article.title} | Ron Picard`
  const ogImage = article.articleHeroUrl ?? article.imageUrl

  return (
    <div className="page page--article">
      <Seo
        title={seoTitle}
        description={truncateMetaDescription(metaDesc)}
        path={path}
        ogType="article"
        ogImage={ogImage}
        jsonLd={articleJsonLd({
          title: article.title,
          date: article.date,
          description: metaDesc,
          path,
        })}
      />

      <SiteTopBar />

      <header className="article-header">
        <Link className="article-back" to="/">
          ← Home
        </Link>
        <h1 className="article-header__title">{article.title}</h1>
        <div className="article-header__meta">
          <span className={`project-card__badge ${badgeClass(article.kind)}`}>
            {badgeLabel(article.kind)}
          </span>
          <time dateTime={article.date}>{formatDate(article.date)}</time>
        </div>
        {heroSrc ? (
          <div className="article-hero">
            <img src={heroSrc} alt="" loading="eager" decoding="async" />
          </div>
        ) : null}
      </header>

      <main className="article-body">
        {proseHtml ? (
          <div
            className="article-prose"
            dangerouslySetInnerHTML={{ __html: proseHtml }}
          />
        ) : article.kind === 'lesson' && article.summary ? (
          <LessonOutline text={article.summary} />
        ) : article.summary ? (
          <p className="article-summary-plain">{article.summary}</p>
        ) : null}

        {(hasDemo || hasCode || videoUrl) && (
          <div className="article-actions article-actions--primary">
            {hasDemo && article.demoUrl ? (
              <a
                className="article-btn article-btn--secondary"
                href={article.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Demo
              </a>
            ) : null}
            {hasCode && article.repoUrl ? (
              <a
                className="article-btn article-btn--secondary"
                href={article.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Code
              </a>
            ) : null}
            {videoUrl ? (
              <a
                className="article-btn article-btn--youtube"
                href={videoUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="article-btn__yt-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" width="18" height="18" focusable="false">
                    <path
                      fill="currentColor"
                      d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1 31.5 31.5 0 0 0 .5-5.8 31.5 31.5 0 0 0-.5-5.8zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"
                    />
                  </svg>
                </span>
                YouTube
              </a>
            ) : null}
          </div>
        )}

        {iframeSrc ? (
          <div className="embed-frame embed-frame--demo">
            <iframe
              title={`${article.title} demo`}
              src={iframeSrc}
              sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-popups-to-escape-sandbox"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="clipboard-write; fullscreen"
            />
          </div>
        ) : null}

        {article.youtubeId ? (
          <div className="embed-frame embed-frame--video">
            <iframe
              title={`${article.title} video`}
              src={`https://www.youtube-nocookie.com/embed/${article.youtubeId}?rel=0`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        ) : null}

        {article.otherEmbed ? (
          <div className="embed-frame embed-frame--demo">
            <iframe
              title={`${article.title} embed`}
              src={article.otherEmbed}
              sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-popups-to-escape-sandbox"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="fullscreen"
            />
          </div>
        ) : null}

        {extras.length > 0 ? (
          <div className="article-actions article-actions--extra">
            {extras.map((link) => (
              <a
                key={`${link.label}:${link.href}`}
                className="article-btn article-btn--secondary"
                href={resolveAssetUrl(link.href) ?? link.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {displayExtraLinkLabel(link.label)}
              </a>
            ))}
          </div>
        ) : null}
      </main>

      <ArticleNav article={article} />

      <footer className="footer">
        <p>
          <Link to="/">All posts</Link>
          {' · '}
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
