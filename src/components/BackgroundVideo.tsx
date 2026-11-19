import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../lib/animatedFigures'

/** Share of the video that must be visible before it plays. */
const VISIBLE_RATIO = 0.25

type Props = {
  /** A validated https MP4 URL (`safeArticleVideoUrl`). */
  src: string
  /** A resolved local poster image, shown until the video plays and under reduced motion. */
  poster: string | null
  /** What the video shows, for screen readers. */
  label: string
}

/**
 * A muted, looping video filling its positioned parent, behind other content.
 * It downloads nothing until it scrolls into view, plays only while in view,
 * and has a pause button, since a loop needs a way to stop it. Visitors who
 * prefer reduced motion, or browsers without IntersectionObserver, see only
 * the poster.
 */
export function BackgroundVideo({ src, poster, label }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const visible = useRef(false)
  const pausedByVisitor = useRef(false)
  const [motionAllowed, setMotionAllowed] = useState(false)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video || typeof IntersectionObserver !== 'function' || prefersReducedMotion()) return undefined
    setMotionAllowed(true)
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible.current = entry.isIntersecting
        if (entry.isIntersecting && !pausedByVisitor.current) {
          // Browsers may still refuse to autoplay; the poster stays.
          video.play()?.catch(() => {})
        } else {
          video.pause()
        }
      },
      { threshold: VISIBLE_RATIO },
    )
    observer.observe(video)
    return () => observer.disconnect()
  }, [])

  const toggle = () => {
    const video = videoRef.current
    if (!video) return
    pausedByVisitor.current = !pausedByVisitor.current
    setPaused(pausedByVisitor.current)
    if (pausedByVisitor.current) video.pause()
    else if (visible.current) video.play()?.catch(() => {})
  }

  return (
    <>
      <video
        ref={videoRef}
        className="background-video"
        aria-label={label}
        poster={poster ?? undefined}
        muted
        loop
        playsInline
        disablePictureInPicture
        preload="none"
      >
        <source src={src} type="video/mp4" />
      </video>
      {motionAllowed ? (
        <button
          type="button"
          className="background-video__toggle"
          aria-label={paused ? 'Play the background video' : 'Pause the background video'}
          aria-pressed={paused}
          onClick={toggle}
        >
          <span aria-hidden>{paused ? '▶' : '❚❚'}</span>
        </button>
      ) : null}
    </>
  )
}
