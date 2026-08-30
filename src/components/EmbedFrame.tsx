import { useEffect, useId, useRef, useState } from 'react'

type EmbedFrameProps = {
  title: string
  src: string
  sandbox: string
  allow?: string
}

export function EmbedFrame({ title, src, sandbox, allow }: EmbedFrameProps) {
  const [expanded, setExpanded] = useState(false)
  const [touchActivated, setTouchActivated] = useState(false)
  const labelId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!expanded) return

    const container = containerRef.current

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setExpanded(false)
        toggleRef.current?.focus()
        return
      }
      // Keep Tab focus inside the expanded overlay (toggle button + iframe).
      if (event.key === 'Tab' && container) {
        const focusables = container.querySelectorAll<HTMLElement>('button, iframe')
        if (focusables.length === 0) return
        const first = focusables[0]!
        const last = focusables[focusables.length - 1]!
        const active = document.activeElement
        if (event.shiftKey && (active === first || !container.contains(active))) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && (active === last || !container.contains(active))) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    // iOS Safari ignores overflow: hidden on the body, so also fix the body in
    // place at the current scroll offset and restore it on exit.
    const scrollY = window.scrollY
    const bodyStyle = document.body.style
    const previous = {
      overflow: bodyStyle.overflow,
      position: bodyStyle.position,
      top: bodyStyle.top,
      left: bodyStyle.left,
      right: bodyStyle.right,
    }
    bodyStyle.overflow = 'hidden'
    bodyStyle.position = 'fixed'
    bodyStyle.top = `-${scrollY}px`
    bodyStyle.left = '0'
    bodyStyle.right = '0'
    document.addEventListener('keydown', onKeyDown)
    if (!container?.contains(document.activeElement)) {
      toggleRef.current?.focus()
    }

    return () => {
      bodyStyle.overflow = previous.overflow
      bodyStyle.position = previous.position
      bodyStyle.top = previous.top
      bodyStyle.left = previous.left
      bodyStyle.right = previous.right
      document.removeEventListener('keydown', onKeyDown)
      window.scrollTo(0, scrollY)
    }
  }, [expanded])

  return (
    <div
      ref={containerRef}
      className={
        expanded ? 'embed-frame embed-frame--demo embed-frame--expanded' : 'embed-frame embed-frame--demo'
      }
      role={expanded ? 'dialog' : 'region'}
      aria-modal={expanded || undefined}
      aria-labelledby={labelId}
    >
      <div className="embed-frame__chrome">
        <span id={labelId} className="visually-hidden">
          {title}
        </span>
        <button
          ref={toggleRef}
          type="button"
          className="embed-frame__expand"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? 'Exit full view' : 'Full view'}
        </button>
      </div>
      <iframe
        title={title}
        src={src}
        sandbox={sandbox}
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        allow={allow}
      />
      {!expanded && !touchActivated && (
        <button
          type="button"
          className="embed-frame__touch-guard"
          onClick={() => setTouchActivated(true)}
        >
          <span className="embed-frame__touch-guard-label">Tap to interact</span>
        </button>
      )}
    </div>
  )
}
