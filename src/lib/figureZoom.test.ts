// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { addFigureZoom, CLOSE_LABEL, ENLARGE_LABEL } from './figureZoom'

afterEach(() => {
  document.body.innerHTML = ''
  vi.unstubAllGlobals()
})

function setup(html: string) {
  document.body.innerHTML = `<div id="r">${html}</div>`
  const root = document.getElementById('r')!
  return { root, cleanup: addFigureZoom(root) }
}

const dialog = () => document.querySelector<HTMLDialogElement>('dialog.figure-lightbox')!

describe('addFigureZoom', () => {
  it('opens a still figure from its image or its button, with the caption, and closes', () => {
    const { root, cleanup } = setup(
      '<figure><img src="/resources/a.svg" alt="A chart"><figcaption> Note the dip. </figcaption></figure>',
    )
    const button = root.querySelector<HTMLButtonElement>(`button[aria-label="${ENLARGE_LABEL}"]`)!
    root.querySelector('img')!.click()
    expect(dialog().hasAttribute('open')).toBe(true)
    const big = dialog().querySelector('img')!
    expect(big.getAttribute('src')).toBe('/resources/a.svg')
    expect(big.alt).toBe('A chart')
    expect(dialog().querySelector('p')!.textContent).toBe('Note the dip.')

    dialog().querySelector<HTMLButtonElement>(`button[aria-label="${CLOSE_LABEL}"]`)!.click()
    expect(dialog().hasAttribute('open')).toBe(false)
    button.click()
    expect(dialog().hasAttribute('open')).toBe(true)
    dialog().click()
    expect(dialog().hasAttribute('open')).toBe(false)

    cleanup()
    expect(root.innerHTML).toBe(
      '<figure class=""><img src="/resources/a.svg" alt="A chart" class=""><figcaption> Note the dip. </figcaption></figure>',
    )
    expect(dialog()).toBeNull()
  })

  it('plays an animated figure enlarged, but opens it from the button only', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    const { root, cleanup } = setup(
      '<figure><img class="article-animated" src="/resources/b.svg#play" alt="B"></figure>',
    )
    root.querySelector('img')!.click()
    expect(dialog().hasAttribute('open')).toBe(false)
    root.querySelector<HTMLButtonElement>('.figure-zoom')!.click()
    expect(dialog().querySelector('img')!.getAttribute('src')).toBe('/resources/b.svg#play')
    expect(dialog().querySelector('p')!.hidden).toBe(true)
    cleanup()
  })

  it('shows the still frame enlarged to visitors who prefer reduced motion', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    const { root, cleanup } = setup('<figure><img class="article-animated" src="/resources/b.svg" alt="B"></figure>')
    root.querySelector<HTMLButtonElement>('.figure-zoom')!.click()
    expect(dialog().querySelector('img')!.getAttribute('src')).toBe('/resources/b.svg')
    cleanup()
  })

  it('skips interactive figures, figures already enhanced, and roots with no figures', () => {
    const { root, cleanup } = setup(
      '<div class="article-interactive"><figure><img src="/resources/c.svg" alt="C"></figure></div><figure><img src="/resources/d.png" alt="D"></figure>',
    )
    expect(root.querySelectorAll('.figure-zoom')).toHaveLength(1)
    const again = addFigureZoom(root)
    expect(root.querySelectorAll('.figure-zoom')).toHaveLength(1)
    again()
    cleanup()
    expect(addFigureZoom(document.createElement('div'))).toBeTypeOf('function')
  })
})
