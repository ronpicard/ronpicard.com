import { Link } from 'react-router-dom'
import type { ArticleSeries, SeriesNeighbor } from '../data/articles'
import { articlePath } from '../../shared/siteArticlesRouting'

type Props = {
  series: ArticleSeries
}

/** "Part 4 of 11", as shown in the article header. */
export function seriesPartLabel(series: ArticleSeries): string {
  return `Part ${series.part} of ${series.total}`
}

function NeighborLink({ neighbor, dir }: { neighbor: SeriesNeighbor; dir: 'prev' | 'next' }) {
  return (
    <Link
      className={`series-nav__link series-nav__link--${dir}`}
      to={articlePath(neighbor.slug)}
      rel={dir}
    >
      <span className="series-nav__dir">
        {dir === 'prev' ? '← Previous' : 'Next →'}: part {neighbor.part}
      </span>
      <span className="series-nav__title">{neighbor.title}</span>
    </Link>
  )
}

/** Previous and next parts of the series a post belongs to. */
export function SeriesNav({ series }: Props) {
  return (
    <nav className="series-nav" aria-label={`${series.name} series`}>
      <p className="series-nav__label">
        {series.name} · {seriesPartLabel(series)}
      </p>
      <div className="series-nav__links">
        {series.prev ? <NeighborLink neighbor={series.prev} dir="prev" /> : null}
        {series.next ? <NeighborLink neighbor={series.next} dir="next" /> : null}
      </div>
    </nav>
  )
}
