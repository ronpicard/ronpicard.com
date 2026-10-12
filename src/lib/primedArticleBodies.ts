/**
 * Article body HTML known before render, keyed by bodyPath: entry-server
 * primes it from dist/ at build time so the prerendered page carries the full
 * text, and main.tsx primes it from that prerendered markup so hydration
 * matches without refetching. Raw HTML — DynamicArticleBody still sanitizes
 * it like a fetched body. Kept apart from DynamicArticleBody so main.tsx does
 * not pull the sanitizer into the entry chunk.
 */
const primed = new Map<string, string>()

export function primeArticleBody(bodyPath: string, html: string) {
  primed.set(bodyPath, html)
}

export function primedArticleBody(bodyPath: string): string | null {
  return primed.get(bodyPath) ?? null
}
