/** Normalized origin + pathname (no hash) for deduping demo/repo vs. extraLinks. */
export function normalizeHrefKey(href: string | null | undefined): string {
  if (!href?.trim()) return ''
  const t = href.trim()
  try {
    const u = new URL(t)
    u.hash = ''
    const p = u.pathname.replace(/\/$/, '') || '/'
    return `${u.origin}${p}`.toLowerCase()
  } catch {
    return t.replace(/\/$/, '').toLowerCase()
  }
}
