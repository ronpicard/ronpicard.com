import { useEffect, useId, useState } from 'react'

type EmbedFrameProps = {
  title: string
  src: string
  sandbox: string
  allow?: string
}

export function EmbedFrame({ title, src, sandbox, allow }: EmbedFrameProps) {
  const [expanded, setExpanded] = useState(false)
  const labelId = useId()

  useEffect(() => {
    if (!expanded) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setExpanded(false)
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [expanded])

  return (
    <div
      className={
        expanded ? 'embed-frame embed-frame--demo embed-frame--expanded' : 'embed-frame embed-frame--demo'
      }
      role="region"
      aria-labelledby={labelId}
    >
      <div className="embed-frame__chrome">
        <span id={labelId} className="visually-hidden">
          {title}
        </span>
        <button
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
    </div>
  )
}
