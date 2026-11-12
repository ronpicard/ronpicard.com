/**
 * Animated article figures are SVG files that show their finished frame by
 * default and loop only when loaded with a `#play` fragment (their looping copy
 * is shown under `#play:target`). This plays each one while it is in view and
 * resets it when it leaves, so it never runs off-screen. Clicking, tapping, or
 * pressing Enter or Space on a figure pauses or resumes it, since a loop needs a
 * way to stop it. Visitors who prefer reduced motion keep the finished frame.
 */
export const ANIMATED_FIGURE_SELECTOR = 'img.article-animated'
export const PLAY_FRAGMENT = '#play'
export const PAUSE_HINT = 'Click to pause the animation'
export const PLAY_HINT = 'Click to play the animation'

/** Share of the figure that must be visible before it plays. */
const VISIBLE_RATIO = 0.6

function baseSrc(img: HTMLImageElement): string {
  const src = img.getAttribute('src') ?? ''
  const hash = src.indexOf('#')
  return hash === -1 ? src : src.slice(0, hash)
}

function setPlaying(img: HTMLImageElement, playing: boolean): void {
  const base = baseSrc(img)
  if (!base) return
  const next = playing ? base + PLAY_FRAGMENT : base
  if (img.getAttribute('src') !== next) img.setAttribute('src', next)
}

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/** Starts watching the animated figures inside `root`; returns a cleanup function. */
export function playAnimatedFigures(root: ParentNode): () => void {
  const figures = Array.from(root.querySelectorAll<HTMLImageElement>(ANIMATED_FIGURE_SELECTOR))
  if (figures.length === 0 || typeof IntersectionObserver !== 'function' || prefersReducedMotion()) {
    return () => {}
  }
  const visible = new Set<HTMLImageElement>()
  const paused = new Set<HTMLImageElement>()
  const update = (img: HTMLImageElement) => {
    setPlaying(img, visible.has(img) && !paused.has(img))
    img.title = paused.has(img) ? PLAY_HINT : PAUSE_HINT
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const img = entry.target as HTMLImageElement
        if (entry.isIntersecting && entry.intersectionRatio >= VISIBLE_RATIO) visible.add(img)
        else if (!entry.isIntersecting) visible.delete(img)
        else continue
        update(img)
      }
    },
    { threshold: [0, VISIBLE_RATIO] },
  )

  const toggle = (img: HTMLImageElement) => {
    if (paused.has(img)) paused.delete(img)
    else paused.add(img)
    update(img)
  }
  const onClick = (event: Event) => toggle(event.currentTarget as HTMLImageElement)
  const onKey = (event: KeyboardEvent) => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    toggle(event.currentTarget as HTMLImageElement)
  }

  for (const img of figures) {
    img.tabIndex = 0
    img.title = PAUSE_HINT
    img.addEventListener('click', onClick)
    img.addEventListener('keydown', onKey)
    observer.observe(img)
  }
  return () => {
    observer.disconnect()
    for (const img of figures) {
      img.removeEventListener('click', onClick)
      img.removeEventListener('keydown', onKey)
      img.removeAttribute('tabindex')
      img.removeAttribute('title')
      setPlaying(img, false)
    }
  }
}
