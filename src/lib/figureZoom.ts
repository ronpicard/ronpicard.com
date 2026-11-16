/**
 * Click-to-enlarge for article figures. Each figure image gets an "Enlarge"
 * button that opens it in a modal `<dialog>` at up to the full window, with its
 * caption. Still images also open on a click; animated ones keep click for
 * pause and play (src/lib/animatedFigures.ts) and open from the button only.
 */
import { ANIMATED_FIGURE_SELECTOR, PLAY_FRAGMENT } from './animatedFigures'

export const ENLARGE_LABEL = 'Enlarge figure'
export const CLOSE_LABEL = 'Close enlarged figure'

const ENLARGE_ICON =
  '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M4 4h6v2H7.4l4 4-1.4 1.4-4-4V10H4zm16 0v6h-2V7.4l-4 4-1.4-1.4 4-4H14V4zM4 20v-6h2v2.6l4-4 1.4 1.4-4 4H10v2zm16 0h-6v-2h2.6l-4-4 1.4-1.4 4 4V14h2z"/></svg>'

function stripFragment(src: string): string {
  const hash = src.indexOf('#')
  return hash === -1 ? src : src.slice(0, hash)
}

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function buildDialog(): { dialog: HTMLDialogElement; img: HTMLImageElement; caption: HTMLParagraphElement } {
  const dialog = document.createElement('dialog')
  dialog.className = 'figure-lightbox'
  dialog.setAttribute('aria-label', 'Enlarged figure')
  const close = document.createElement('button')
  close.type = 'button'
  close.className = 'figure-lightbox__close'
  close.setAttribute('aria-label', CLOSE_LABEL)
  close.textContent = '×'
  const img = document.createElement('img')
  img.className = 'figure-lightbox__img'
  const caption = document.createElement('p')
  caption.className = 'figure-lightbox__caption'
  dialog.append(close, img, caption)
  close.addEventListener('click', () => closeDialog(dialog))
  // A click on the backdrop lands on the dialog itself, outside its content.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) closeDialog(dialog)
  })
  return { dialog, img, caption }
}

function closeDialog(dialog: HTMLDialogElement): void {
  if (typeof dialog.close === 'function') dialog.close()
  else dialog.removeAttribute('open')
}

/** Adds enlarge buttons to the figures inside `root`; returns a cleanup function. */
export function addFigureZoom(root: ParentNode): () => void {
  const images = Array.from(root.querySelectorAll<HTMLImageElement>('figure img')).filter(
    (img) => !img.closest('.article-interactive') && !img.closest('figure')?.querySelector('.figure-zoom'),
  )
  if (images.length === 0) return () => {}

  const { dialog, img: bigImg, caption } = buildDialog()
  document.body.append(dialog)
  const added: { figure: HTMLElement; button: HTMLButtonElement; img: HTMLImageElement; open: () => void }[] = []

  for (const img of images) {
    const figure = img.closest('figure') as HTMLElement
    const animated = img.matches(ANIMATED_FIGURE_SELECTOR)
    const open = () => {
      const base = stripFragment(img.getAttribute('src') ?? '')
      if (!base) return
      bigImg.src = animated && !prefersReducedMotion() ? base + PLAY_FRAGMENT : base
      bigImg.alt = img.alt
      caption.textContent = figure.querySelector('figcaption')?.textContent?.trim() ?? ''
      caption.hidden = !caption.textContent
      if (typeof dialog.showModal === 'function') dialog.showModal()
      else dialog.setAttribute('open', '')
    }
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'figure-zoom'
    button.setAttribute('aria-label', ENLARGE_LABEL)
    button.title = ENLARGE_LABEL
    button.innerHTML = ENLARGE_ICON
    button.addEventListener('click', open)
    figure.classList.add('figure--zoomable')
    figure.append(button)
    if (!animated) {
      img.classList.add('figure-zoom__target')
      img.addEventListener('click', open)
    }
    added.push({ figure, button, img, open })
  }

  return () => {
    closeDialog(dialog)
    dialog.remove()
    for (const { figure, button, img, open } of added) {
      button.remove()
      figure.classList.remove('figure--zoomable')
      img.classList.remove('figure-zoom__target')
      img.removeEventListener('click', open)
    }
  }
}
