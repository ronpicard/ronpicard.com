import type { ComponentType } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { GdLearningRateFigure } from '../components/interactive/GdLearningRateFigure'
import { MomentumBetaFigure } from '../components/interactive/MomentumBetaFigure'
import { SigmoidNeuronFigure } from '../components/interactive/SigmoidNeuronFigure'
import '../components/interactive/interactive.css'

export const INTERACTIVE_FIGURES: Record<string, ComponentType> = {
  'gd-learning-rate': GdLearningRateFigure,
  'momentum-beta': MomentumBetaFigure,
  'sigmoid-neuron': SigmoidNeuronFigure,
}

const PREFIX = 'article-interactive--'
const MOUNTED_ATTR = 'data-interactive-mounted'

function figureKey(el: Element): string | null {
  for (const cls of Array.from(el.classList)) {
    if (cls.startsWith(PREFIX)) {
      const key = cls.slice(PREFIX.length)
      if (Object.prototype.hasOwnProperty.call(INTERACTIVE_FIGURES, key)) return key
    }
  }
  return null
}

/**
 * Replace each `div.article-interactive--KEY` placeholder under `root` with its React component.
 * The static fallback children stay in the DOM (hidden). Returns a cleanup that unmounts and restores them.
 * Placeholders already mounted are skipped, so calling this twice does not double mount.
 */
export function mountInteractiveFigures(root: ParentNode): () => void {
  const mounted: { root: Root; container: HTMLElement; fallback: HTMLElement; host: Element }[] = []
  root.querySelectorAll('div.article-interactive').forEach((host) => {
    const key = figureKey(host)
    if (!key || host.hasAttribute(MOUNTED_ATTR)) return
    const fallback = host.ownerDocument.createElement('div')
    fallback.className = 'article-interactive__fallback'
    fallback.hidden = true
    while (host.firstChild) fallback.appendChild(host.firstChild)
    const container = host.ownerDocument.createElement('div')
    container.className = 'article-interactive__mount'
    host.append(fallback, container)
    host.setAttribute(MOUNTED_ATTR, '')
    const reactRoot = createRoot(container)
    const Figure = INTERACTIVE_FIGURES[key]
    reactRoot.render(<Figure />)
    mounted.push({ root: reactRoot, container, fallback, host })
  })
  return () => {
    for (const m of mounted.splice(0)) {
      m.root.unmount()
      m.container.remove()
      while (m.fallback.firstChild) m.host.insertBefore(m.fallback.firstChild, m.fallback)
      m.fallback.remove()
      m.host.removeAttribute(MOUNTED_ATTR)
    }
  }
}
