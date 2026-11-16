/**
 * Responsive WebP copies of large article images. Sources stay untouched in
 * public/resources/; scripts/generate-sized.mjs writes one file per width to
 * public/resources/sized/ and article pages reference them through `srcset`.
 * Every width exists for every source (smaller sources are never enlarged, so
 * they simply yield a smaller file under the same name).
 */
export const RESOURCE_SIZED_DIR = 'resources/sized'
export const SIZED_WIDTHS = [768, 1280, 1920] as const
export const SIZED_QUALITY = 78

/** Local raster images only: GIFs (animation) and SVGs (vector) are excluded. */
const LOCAL_RESOURCE_RASTER_RE = /^resources\/([a-z0-9][a-z0-9._-]*)\.(?:png|jpe?g|webp)$/i

/** `resources/<name>.<ext>` → `resources/sized/<name>-<width>.webp`, or null. */
export function resourceSizedPath(
  resourcePath: string | null | undefined,
  width: number,
): string | null {
  if (resourcePath == null) return null
  const match = LOCAL_RESOURCE_RASTER_RE.exec(resourcePath.trim())
  if (!match) return null
  return `${RESOURCE_SIZED_DIR}/${match[1]}-${width}.webp`
}

/** `srcset` value for all sized variants, or null when the path is not a local raster image. */
export function resourceSrcSet(
  resourcePath: string | null | undefined,
  resolve: (sizedPath: string) => string,
): string | null {
  const entries = SIZED_WIDTHS.map((width) => {
    const path = resourceSizedPath(resourcePath, width)
    return path ? `${resolve(path)} ${width}w` : null
  })
  return entries.includes(null) ? null : entries.join(', ')
}
