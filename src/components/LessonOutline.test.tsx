// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { LessonOutline } from './LessonOutline'

let container: HTMLDivElement
let root: Root

beforeEach(() => {
  ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
    .IS_REACT_ACT_ENVIRONMENT = true
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

describe('LessonOutline', () => {
  it('splits dash-delimited outline text into list items', () => {
    act(() => {
      root.render(<LessonOutline text={'Intro -First topic\n -Second topic -'} />)
    })
    const items = Array.from(container.querySelectorAll('.lesson-outline__item')).map(
      (el) => el.textContent,
    )
    expect(items).toEqual(['Intro', 'First topic', 'Second topic'])
  })

  it('renders an empty list for blank text', () => {
    act(() => {
      root.render(<LessonOutline text={'  \n '} />)
    })
    expect(container.querySelectorAll('.lesson-outline__item')).toHaveLength(0)
  })
})
