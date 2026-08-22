import type { ArticleKind } from '../data/articles'

export function formatArticleDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(iso + 'T12:00:00'))
}

export function articleKindBadgeClass(kind: ArticleKind): string {
  if (kind === 'app') return 'project-card__badge--app'
  if (kind === 'lesson') return 'project-card__badge--lesson'
  return 'project-card__badge--post'
}

export function articleKindLabel(kind: ArticleKind): string {
  if (kind === 'app') return 'Web app'
  if (kind === 'lesson') return 'Lesson'
  return 'Article'
}

/** Compact label for search results. */
export function articleKindShortLabel(kind: ArticleKind): string {
  if (kind === 'app') return 'App'
  if (kind === 'lesson') return 'Lesson'
  return 'Article'
}
