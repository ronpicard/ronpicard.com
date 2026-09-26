/**
 * Social share (Open Graph) cards derived from mirrored post images. Sources
 * stay untouched in public/resources/; scripts/generate-og-images.mjs writes
 * 1200×630 JPEG cards to public/resources/og/ and prerender points each
 * post's og:image / twitter:image at its card.
 */
export const RESOURCE_OG_DIR = 'resources/og'

/** The 1.91:1 size Facebook, LinkedIn and X render large previews at. */
export const OG_WIDTH = 1200
export const OG_HEIGHT = 630
export const OG_QUALITY = 82

/** Same filename charset as assetUrl's local-resource rule, limited to images. */
const LOCAL_RESOURCE_IMAGE_RE =
  /^resources\/([a-z0-9][a-z0-9._-]*)\.(?:png|jpe?g|webp|gif|avif)$/i

/** The image a post shares: its hero when set, else its title image. */
export function postShareImage(row: {
  articleHeroUrl?: string | null
  imageUrl?: string | null
}): string | null {
  return row.articleHeroUrl || row.imageUrl || null
}

/**
 * `resources/<name>.<img-ext>` → `resources/og/<name>.jpg`, or null for
 * anything that is not a mirrored local image (PDFs, external URLs, …).
 */
export function resourceOgPath(resourcePath: string | null | undefined): string | null {
  if (resourcePath == null) return null
  const match = LOCAL_RESOURCE_IMAGE_RE.exec(resourcePath.trim())
  if (!match) return null
  return `${RESOURCE_OG_DIR}/${match[1]}.jpg`
}
