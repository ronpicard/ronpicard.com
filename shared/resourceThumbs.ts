/**
 * Card thumbnails derived from mirrored title images. Sources stay untouched in
 * public/resources/; scripts/generate-thumbs.mjs writes downscaled WebP copies
 * to public/resources/thumbs/ and the card grid loads those instead.
 */
export const RESOURCE_THUMBS_DIR = 'resources/thumbs'

/** Card frames render at ≤384 CSS px wide; 768px covers 2x displays. */
export const THUMB_WIDTH = 768
export const THUMB_QUALITY = 75

/** Same filename charset as assetUrl's local-resource rule, limited to images. */
const LOCAL_RESOURCE_IMAGE_RE =
  /^resources\/([a-z0-9][a-z0-9._-]*)\.(?:png|jpe?g|webp|gif|avif)$/i

/**
 * `resources/<name>.<img-ext>` → `resources/thumbs/<name>.webp`, or null for
 * anything that is not a mirrored local image (PDFs, external URLs, …).
 */
export function resourceThumbPath(resourcePath: string | null | undefined): string | null {
  if (resourcePath == null) return null
  const match = LOCAL_RESOURCE_IMAGE_RE.exec(resourcePath.trim())
  if (!match) return null
  return `${RESOURCE_THUMBS_DIR}/${match[1]}.webp`
}
