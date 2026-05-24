/** Shared fetch helper for Squarespace mirror scripts. */
export async function fetchText(url) {
  const res = await fetch(url, { headers: { 'user-agent': 'ronpicard.com-mirror/1.0' } })
  if (!res.ok) throw new Error(`${url} ${res.status}`)
  return res.text()
}
