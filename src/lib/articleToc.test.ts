import { describe, expect, it } from 'vitest'
import { outlineArticleHtml, showsTableOfContents, TOC_MIN_WORDS, WORDS_PER_MINUTE } from './articleToc'

const words = (n: number) => Array.from({ length: n }, () => 'word').join(' ')

describe('outlineArticleHtml', () => {
  it('adds a section id to each h2 and lists it, decoding entities and dropping markup', () => {
    const out = outlineArticleHtml(
      '<p>Intro</p><h2>Why <em>momentum</em> helps</h2><p>a</p><h2 class="x">Q&amp;A: 1 &lt; 2</h2><h3>Not listed</h3>',
    )
    expect(out.toc).toEqual([
      { id: 'section-why-momentum-helps', text: 'Why momentum helps' },
      { id: 'section-q-a-1-2', text: 'Q&A: 1 < 2' },
    ])
    expect(out.html).toContain('<h2 id="section-why-momentum-helps">Why <em>momentum</em> helps</h2>')
    expect(out.html).toContain('<h2 class="x" id="section-q-a-1-2">')
    expect(out.html).toContain('<h3>Not listed</h3>')
  })

  it('keeps ids unique and falls back for headings with no latin letters', () => {
    const out = outlineArticleHtml('<h2>Results</h2><h2>Results</h2><h2>∀∃</h2><h2>   </h2>')
    expect(out.toc.map((e) => e.id)).toEqual(['section-results', 'section-results-2', 'section-part'])
    expect(out.html).toContain('<h2>   </h2>')
  })

  it('never adds a second id to a heading that already has one', () => {
    const out = outlineArticleHtml('<h2 id="kept">Kept</h2>')
    expect(out.toc).toEqual([])
    expect(out.html).toBe('<h2 id="kept">Kept</h2>')
  })

  it('decodes numeric entities and leaves unknown ones as written', () => {
    const out = outlineArticleHtml('<h2>&#8592; Back &#x2192; &bogus; &#0;</h2>')
    expect(out.toc[0]?.text).toBe('← Back → &bogus; &#0;')
  })

  it('counts words and reading minutes, with at least one minute', () => {
    expect(outlineArticleHtml('').minutes).toBe(1)
    expect(outlineArticleHtml('').words).toBe(0)
    const long = outlineArticleHtml(`<p>${words(WORDS_PER_MINUTE * 10)}</p>`)
    expect(long.words).toBe(WORDS_PER_MINUTE * 10)
    expect(long.minutes).toBe(10)
  })
})

describe('showsTableOfContents', () => {
  const body = (sections: number, total: number) =>
    Array.from({ length: sections }, (_, i) => `<h2>Part ${i}</h2>`).join('') + `<p>${words(total)}</p>`

  it('needs at least four sections and a long body', () => {
    expect(showsTableOfContents(outlineArticleHtml(body(4, TOC_MIN_WORDS)))).toBe(true)
    expect(showsTableOfContents(outlineArticleHtml(body(3, TOC_MIN_WORDS)))).toBe(false)
    expect(showsTableOfContents(outlineArticleHtml(body(6, 200)))).toBe(false)
  })
})
