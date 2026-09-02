import { Link, Navigate, useParams } from 'react-router-dom'
import { ArticleNav } from '../components/ArticleNav'
import { LessonOutline } from '../components/LessonOutline'
import { Seo } from '../components/Seo'
import { DynamicGithubReadme } from '../components/DynamicGithubReadme'
import { DynamicArticleBody } from '../components/DynamicArticleBody'
import { SiteTopBar } from '../components/SiteTopBar'
import {
  filterExtraLinks,
  getArticle,
  isThirdPartyArticleLink,
  showCodeButton,
  showDemoButton,
  showReleasesButton,
  youtubeWatchUrl,
} from '../data/articles'
import { resolveAssetUrl, resolveReadmeSnapshotUrl } from '../lib/assetUrl'
import { githubBlobViewerUrlFromRawUrl } from '../../shared/githubRawContentUrls'
import {
  safeArticleLinkHref,
  safeDemoUrl,
  safeGithubPagesUrl,
  safeGithubReadmeRawUrl,
  safeGithubReleasesUrl,
  safeGithubRepoUrl,
  safeHttpsEmbedUrl,
  safeYoutubeId,
} from '../lib/safeUrls'
import { isSafePublicSlug } from '../config/security'
import {
  articleKindBadgeClass,
  articleKindLabel,
  formatArticleDate,
} from '../lib/articleDisplay'
import { DEFAULT_TITLE, truncateMetaDescription } from '../lib/siteMeta'
import { EmbedFrame } from '../components/EmbedFrame'
import { YoutubeIcon } from '../components/YoutubeIcon'

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
  if (!isSafePublicSlug(slug)) {
    return <Navigate to="/" replace />
  }
  const article = getArticle(slug)

  if (!article) {
    return <Navigate to="/" replace />
  }

  if (slug !== article.slug) {
    return <Navigate to={`/blog/${article.slug}`} replace />
  }

  const cleanGithubEmbed = article.githubEmbed ? stripQuery(article.githubEmbed) : null
  const approvedEmbed = cleanGithubEmbed ? safeGithubPagesUrl(cleanGithubEmbed) : null
  const iframeSrc = approvedEmbed
    ? approvedEmbed.endsWith('/')
      ? approvedEmbed
      : `${approvedEmbed}/`
    : null

  const extras = filterExtraLinks(article)
  const demoHref = safeDemoUrl(article.demoUrl)
  const repoHref = safeGithubRepoUrl(article.repoUrl)
  const hasDemo = showDemoButton(article) && !!demoHref
  const hasCode = showCodeButton(article) && !!repoHref
  const releasesHref = showReleasesButton(article) ? safeGithubReleasesUrl(article.releasesUrl) : null
  const ytId = safeYoutubeId(article.youtubeId)
  const videoUrl = youtubeWatchUrl(article.youtubeId)
  const readmeRawUrl = safeGithubReadmeRawUrl(article.readmeRawUrl)
  const otherEmbedSrc = article.otherEmbed ? safeHttpsEmbedUrl(stripQuery(article.otherEmbed)) : null
  const safeExtras = extras.flatMap((link) => {
    const href = safeArticleLinkHref(link.href, resolveAssetUrl)
    return href ? [{ link, href, articleStyle: isThirdPartyArticleLink(link) }] : []
  })
  // Trailing slash matches the prerendered canonical (GitHub Pages 301s to it).
  const path = `/blog/${article.slug}/`
  const metaDesc =
    article.summary?.replace(/&nbsp;/gi, ' ').replace(/<[^>]+>/g, '') ||
    `${article.title} — ${DEFAULT_TITLE}`
  const seoTitle = `${article.title} | Ron Picard`
  const ogImage = article.articleHeroUrl ?? article.imageUrl

  const textBlock = readmeRawUrl ? (
    <DynamicGithubReadme
      rawUrl={readmeRawUrl}
      fallbackSummary={article.summary}
      viewerUrl={githubBlobViewerUrlFromRawUrl(readmeRawUrl)}
      snapshotUrl={resolveReadmeSnapshotUrl(article.slug)}
    />
  ) : article.bodyPath ? (
    <DynamicArticleBody bodyPath={article.bodyPath} fallbackSummary={article.summary} />
  ) : article.kind === 'lesson' && article.summary ? (
    <LessonOutline text={article.summary} />
  ) : article.summary ? (
    <p className="article-summary-plain">{article.summary}</p>
  ) : null

  const embedBlock = (
    <>
      {(hasDemo || hasCode || releasesHref || videoUrl || safeExtras.length > 0) && (
        <div className="article-actions article-actions--primary">
          {hasDemo && demoHref ? (
            <a
              className="article-btn article-btn--secondary"
              href={demoHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              Demo
            </a>
          ) : null}
          {hasCode && repoHref ? (
            <a
              className="article-btn article-btn--secondary"
              href={repoHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              Code
            </a>
          ) : null}
          {releasesHref ? (
            <a
              className="article-btn article-btn--secondary"
              href={releasesHref}
              target="_blank"
              rel="noopener noreferrer"
            >
              Releases
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
                <YoutubeIcon size={18} />
              </span>
              YouTube
            </a>
          ) : null}
          {safeExtras.map(({ link, href, articleStyle }) => (
            <a
              key={`${link.label}:${link.href}`}
              className={
                articleStyle
                  ? 'project-card__btn project-card__btn--article'
                  : 'article-btn article-btn--secondary'
              }
              href={href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {displayExtraLinkLabel(link.label)}
            </a>
          ))}
        </div>
      )}

      {iframeSrc ? (
        <EmbedFrame
          title={`${article.title} demo`}
          src={iframeSrc}
          sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-popups allow-popups-to-escape-sandbox"
          allow="clipboard-write; fullscreen"
        />
      ) : null}

      {ytId ? (
        <div className="embed-frame embed-frame--video">
          <iframe
            title={`${article.title} video`}
            src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(ytId)}?rel=0`}
            sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-presentation"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      ) : null}

      {otherEmbedSrc ? (
        <EmbedFrame
          title={`${article.title} embed`}
          src={otherEmbedSrc}
          sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-popups allow-popups-to-escape-sandbox"
          allow="fullscreen"
        />
      ) : null}
    </>
  )

  return (
    <div className="page page--article">
      <Seo
        title={seoTitle}
        description={truncateMetaDescription(metaDesc)}
        path={path}
        ogType="article"
        ogImage={ogImage}
      />

      <SiteTopBar />

      <header className="article-header">
        <Link className="article-back" to="/">
          ← Home
        </Link>
        <h1 className="article-header__title">{article.title}</h1>
        <div className="article-header__meta">
          <span className={`project-card__badge ${articleKindBadgeClass(article.kind)}`}>
            {articleKindLabel(article.kind)}
          </span>
          <time dateTime={article.date}>{formatArticleDate(article.date)}</time>
        </div>
      </header>

      <main id="main-content" className="article-body" tabIndex={-1}>
        {embedBlock}
        {textBlock}
      </main>

      <ArticleNav article={article} />

      <footer className="footer">
        <p>
          <Link to="/">All posts</Link>
        </p>
      </footer>
    </div>
  )
}
