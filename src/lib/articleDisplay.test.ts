import { describe, expect, it } from 'vitest'
import {
  articleKindBadgeClass,
  articleKindLabel,
  articleKindShortLabel,
  formatArticleDate,
} from './articleDisplay'

describe('formatArticleDate', () => {
  it('formats ISO dates in en-US', () => {
    expect(formatArticleDate('2024-06-15')).toMatch(/Jun/)
    expect(formatArticleDate('2024-06-15')).toMatch(/2024/)
  })
})

describe('article kind labels', () => {
  it('maps kinds to badge classes and labels', () => {
    expect(articleKindBadgeClass('app')).toBe('project-card__badge--app')
    expect(articleKindBadgeClass('lesson')).toBe('project-card__badge--lesson')
    expect(articleKindBadgeClass('post')).toBe('project-card__badge--post')
    expect(articleKindLabel('app')).toBe('Web app')
    expect(articleKindLabel('lesson')).toBe('Lesson')
    expect(articleKindLabel('post')).toBe('Article')
    expect(articleKindShortLabel('app')).toBe('App')
    expect(articleKindShortLabel('lesson')).toBe('Lesson')
    expect(articleKindShortLabel('post')).toBe('Article')
  })
})
