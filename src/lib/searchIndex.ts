import { useEffect, useState } from 'react'
import {
  parseSearchIndex,
  SEARCH_INDEX_FILE,
  SEARCH_INDEX_MAX_BYTES,
  type SearchIndex,
} from '../../shared/searchIndex'
import { getViteBasePath } from './assetUrl'
import { readBoundedResponseText } from './readBoundedResponseText'

let pending: Promise<SearchIndex> | null = null

async function fetchSearchIndex(): Promise<SearchIndex> {
  const url = `${getViteBasePath()}/${SEARCH_INDEX_FILE}`
  const response = await fetch(url, { credentials: 'same-origin' })
  if (!response.ok) throw new Error(`search index request failed with HTTP ${response.status}`)
  const text = await readBoundedResponseText(response, SEARCH_INDEX_MAX_BYTES, 'search index')
  return parseSearchIndex(JSON.parse(text))
}

/** Loads the article full-text index once; a failed load is retried on the next call. */
export function loadSearchIndex(): Promise<SearchIndex> {
  pending ??= fetchSearchIndex().catch((error: unknown) => {
    pending = null
    throw new Error('Could not load the article search index', { cause: error })
  })
  return pending
}

/** Test hook: forget the cached index. */
export function resetSearchIndexForTests(): void {
  pending = null
}

/**
 * The full-text index once `enabled` turns true (the first search), or null
 * until it arrives. Search falls back to titles and summaries if it fails.
 */
export function useSearchIndex(enabled: boolean): SearchIndex | null {
  const [index, setIndex] = useState<SearchIndex | null>(null)
  useEffect(() => {
    if (!enabled || index) return
    let live = true
    loadSearchIndex().then(
      (loaded) => {
        if (live) setIndex(loaded)
      },
      (error: unknown) => console.error(error),
    )
    return () => {
      live = false
    }
  }, [enabled, index])
  return index
}
