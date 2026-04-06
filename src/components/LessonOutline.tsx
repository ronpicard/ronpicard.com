type Props = {
  text: string
}

export function LessonOutline({ text }: Props) {
  const normalized = text.replace(/\n+/g, ' ').trim()
  const lines = normalized
    .split(' -')
    .map((s) => s.trim())
    .filter(Boolean)

  return (
    <ul className="lesson-outline" role="list">
      {lines.map((line, i) => (
        <li key={i} className="lesson-outline__item">
          {line}
        </li>
      ))}
    </ul>
  )
}
