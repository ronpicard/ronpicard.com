/**
 * Topic hubs (`/topics/<slug>/`) and how each post maps to one (app + prerender).
 * A row's JSON `topic` wins; otherwise its kind picks the default topic.
 */

/** `app` = embedded web app; `software` = downloadable app shipped as GitHub releases, without a written article. */
export type ArticleKind = 'app' | 'software' | 'lesson' | 'post'

export function deriveArticleKind(row: {
  slug: string
  title: string
  githubEmbed: string | null
  releasesUrl?: string | null
  bodyPath?: string | null
}): ArticleKind {
  if (row.githubEmbed) return 'app'
  // A written article about released software stays an article.
  if (row.releasesUrl && !row.bodyPath) return 'software'
  // Some lessons keep Squarespace storage slugs, so the title decides too.
  if (/software-lessons-session/i.test(row.slug) || /^Software Lessons Session\b/i.test(row.title)) {
    return 'lesson'
  }
  return 'post'
}

export type ArticleTopic = {
  slug: string
  /** Hub heading and link text. */
  label: string
  /** Meta description for the hub page. */
  description: string
  /** Visible intro paragraph on the hub page. */
  intro: string
}

export const ARTICLE_TOPICS = [
  {
    slug: 'web-apps-and-games',
    label: 'Web Apps & Games',
    description:
      'Free 3D browser games, simulators, and visualizers by Ron Picard: a Cessna flight simulator, casino games, pinball, puzzles, and algorithm visualizers.',
    intro:
      'Games, simulators, and interactive visualizers that run right in your browser, with nothing to install. Each post embeds the app and links to its source code.',
  },
  {
    slug: 'software-and-tools',
    label: 'Software, Tools & Tutorials',
    description:
      'VS Code extensions, desktop apps, and hands-on tutorials by Ron Picard, from AI coding agent rules to a ClamAV GUI, a home VPN, and a Linux router.',
    intro:
      'Developer tools and desktop software I have released, plus step-by-step tutorials for building your own networking and web infrastructure.',
  },
  {
    slug: 'software-engineering-lessons',
    label: 'Software Engineering Lessons',
    description:
      'A free software engineering video series: computer architecture, networking, operating systems, Python, C++, data structures, Big-O, and agentic coding.',
    intro:
      'A free video series that teaches software engineering from the ground up, starting with how computers work and building up to C++, data structures, and AI-assisted coding.',
  },
  {
    slug: 'ai-and-machine-learning',
    label: 'AI, Machine Learning & Autonomy',
    description:
      'Ron Picard on artificial intelligence, autonomous aircraft, and machine learning, from neural network walkthroughs to AI agents flying the X-62A VISTA.',
    intro:
      'Writing on artificial general intelligence, AI coding tools, and autonomy for aircraft, plus notebook walkthroughs that build neural networks and regression from scratch.',
  },
  {
    slug: 'formal-methods-and-research',
    label: 'Formal Methods & Research',
    description:
      'Formal Methods 101 tutorials on logic, SAT, SMT, and decidability, plus research projects in model checking, controls, robotics, and computer vision.',
    intro:
      'An introductory series on formal methods, from set theory and logic to SAT and SMT solvers, alongside research projects in model checking, control systems, and robotics.',
  },
  {
    slug: 'aviation',
    label: 'Aviation & Hobbies',
    description:
      'Flying logs from pilot Ron Picard: first solo flights, the private pilot checkride, multi-engine and aerobatic aircraft, plus ham radio and boating licenses.',
    intro:
      'Flying logs from my first student solos through the private pilot checkride and the airplanes I have flown since, plus other licenses like ham radio and boating.',
  },
] as const satisfies readonly ArticleTopic[]

export type ArticleTopicSlug = (typeof ARTICLE_TOPICS)[number]['slug']

const DEFAULT_TOPIC_BY_KIND: Record<ArticleKind, ArticleTopicSlug | null> = {
  app: 'web-apps-and-games',
  software: 'software-and-tools',
  lesson: 'software-engineering-lessons',
  post: null,
}

const topicsBySlug = new Map<string, ArticleTopic>(ARTICLE_TOPICS.map((t) => [t.slug, t]))

export function isArticleTopicSlug(value: unknown): value is ArticleTopicSlug {
  return typeof value === 'string' && topicsBySlug.has(value)
}

export function getArticleTopic(slug: string | null | undefined): ArticleTopic | undefined {
  return slug ? topicsBySlug.get(slug) : undefined
}

/** The row's own topic, else its kind's default (null for a post without one). */
export function resolveArticleTopic(
  row: { topic?: ArticleTopicSlug | null },
  kind: ArticleKind,
): ArticleTopicSlug | null {
  return row.topic ?? DEFAULT_TOPIC_BY_KIND[kind]
}

/** Public path of a topic hub, trailing slash included (the URL GitHub Pages serves). */
export function topicPath(slug: string): string {
  return `/topics/${slug}/`
}
