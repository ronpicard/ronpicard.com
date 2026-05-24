type Props = {
  size?: number
}

const YT_PATH =
  'M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1 31.5 31.5 0 0 0 .5-5.8 31.5 31.5 0 0 0-.5-5.8zM9.75 15.02V8.98L15.5 12l-5.75 3.02z'

export function YoutubeIcon({ size = 16 }: Props) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} focusable="false" aria-hidden>
      <path fill="currentColor" d={YT_PATH} />
    </svg>
  )
}
