import { useId } from 'react'
import { getViteBasePath } from '../lib/assetUrl'
import { linkBrandForHref } from '../lib/linkBrand'

/*
 * Third-party logos in their official colors, drawn inline so the strict CSP needs no extra
 * image sources. All are decorative: the link text or aria-label names them.
 */

type IconProps = {
  size?: number
  className?: string
}

const YOUTUBE_PATH =
  'M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1 31.5 31.5 0 0 0 .5-5.8 31.5 31.5 0 0 0-.5-5.8z'

/*
 * GitHub's and LinkedIn's own white marks from their brand kits (public/social/), unaltered:
 * the kits' versions for dark backgrounds, which is all this site has.
 */
function BrandFile({ file, ratio, size = 22, className }: IconProps & { file: string; ratio: number }) {
  return (
    <img
      className={['brand-logo', className].filter(Boolean).join(' ')}
      src={`${getViteBasePath()}/social/${file}`}
      alt=""
      width={Math.round(size * ratio)}
      height={size}
      decoding="async"
    />
  )
}

/** LinkedIn's [in] bug, its all-white version. */
export function LinkedInIcon(props: IconProps) {
  return <BrandFile file="linkedin-in-bug-white.png" ratio={840 / 779} {...props} />
}

/** GitHub's Invertocat, its white version. */
export function GitHubIcon(props: IconProps) {
  return <BrandFile file="github-invertocat-white.svg" ratio={98 / 96} {...props} />
}

/** YouTube's mark: white play triangle on the red rounded rectangle. */
export function YouTubeIcon({ size = 22, className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <path fill="#ff0000" d={YOUTUBE_PATH} />
      <path fill="#fff" d="M9.75 15.02V8.98L15.5 12z" />
    </svg>
  )
}

/** Visual Studio Code's product icon (microsoft/vscode), without its drop shadows. */
export function VSCodeIcon({ size = 22, className }: IconProps) {
  const maskId = `${useId().replace(/:/g, '')}-vscode`
  return (
    <svg className={className} viewBox="5 5 86 86" width={size} height={size} aria-hidden>
      <mask id={maskId} maskUnits="userSpaceOnUse" x="6" y="6" width="84" height="84">
        <path
          fill="#fff"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M65.566 89.4264C66.889 89.9418 68.3976 89.9087 69.7329 89.2662L87.0271 80.9446C88.8444 80.0701 90 78.231 90 76.2132V19.7872C90 17.7695 88.8444 15.9303 87.0271 15.0559L69.7329 6.73395C67.9804 5.89069 65.9295 6.09724 64.3914 7.21543C64.1716 7.37517 63.9624 7.55352 63.7659 7.75007L30.6583 37.9548L16.2372 27.0081C14.8948 25.9891 13.0171 26.0726 11.7702 27.2067L7.14495 31.4141C5.61986 32.8014 5.61811 35.2007 7.14117 36.5902L19.6476 48.0001L7.14117 59.4099C5.61811 60.7995 5.61986 63.1988 7.14495 64.5861L11.7702 68.7934C13.0171 69.9276 14.8948 70.0111 16.2372 68.9921L30.6583 58.0453L63.7659 88.2501C64.2897 88.7741 64.9046 89.1688 65.566 89.4264ZM69.0128 28.9311L43.8917 48.0001L69.0128 67.069V28.9311Z"
        />
      </mask>
      <g mask={`url(#${maskId})`}>
        <path
          fill="#0065A9"
          d="M87.0275 15.0688L69.7198 6.73546C67.7164 5.77087 65.3223 6.17776 63.75 7.75L7.09081 59.4099C5.56682 60.7994 5.56857 63.1987 7.09459 64.586L11.7227 68.7934C12.9703 69.9275 14.8491 70.011 16.1924 68.992L84.4232 17.2307C86.7122 15.4942 90 17.1268 90 20V19.7991C90 17.7823 88.8447 15.9437 87.0275 15.0688Z"
        />
        <path
          fill="#007ACC"
          d="M87.0275 80.9312L69.7198 89.2646C67.7164 90.2292 65.3223 89.8223 63.75 88.25L7.09081 36.5902C5.56682 35.2007 5.56857 32.8013 7.09459 31.414L11.7227 27.2067C12.9703 26.0725 14.8491 25.989 16.1924 27.008L84.4232 78.7693C86.7122 80.5058 90 78.8732 90 76V76.201C90 78.2178 88.8447 80.0563 87.0275 80.9312Z"
        />
        <path
          fill="#1F9CF0"
          d="M69.7206 89.2661C67.7166 90.2298 65.3224 89.8223 63.75 88.25C65.6874 90.1873 69 88.8152 69 86.0753V9.92459C69 7.18472 65.6874 5.81259 63.75 7.74996C65.3224 6.17757 67.7166 5.77012 69.7206 6.73385L87.0253 15.0558C88.8437 15.9302 90 17.7694 90 19.7871V76.2131C90 78.2309 88.8436 80.07 87.0253 80.9445L69.7206 89.2661Z"
        />
      </g>
    </svg>
  )
}

/** Open VSX registry mark (eclipse/openvsx), the two-tone purple triangles. */
export function OpenVsxIcon({ size = 22, className }: IconProps) {
  return (
    <svg className={className} viewBox="-8.7 4.3 124 124" width={size} height={size} aria-hidden>
      <path fill="#c160ef" d="M30 44.2L52.6 5H7.3zM4.6 88.5h45.3L27.2 49.4zm51 0l22.6 39.2 22.6-39.2z" />
      <path fill="#a60ee5" d="M52.6 5L30 44.2h45.2zM27.2 49.4l22.7 39.1 22.6-39.1zm51 0L55.6 88.5h45.2z" />
    </svg>
  )
}

/** Wyvern Systems' gradient logo, shipped as a keyed-out PNG. */
export function WyvernIcon({ size = 22, className }: IconProps) {
  return (
    <img
      className={className}
      src={`${getViteBasePath()}/wyvern-systems-logo.png`}
      alt=""
      width={size}
      height={size}
      decoding="async"
    />
  )
}

/** BotLegger's robot-head mark, shipped as a transparent PNG. */
export function BotleggerIcon({ size = 22, className }: IconProps) {
  return (
    <img
      className={className}
      src={`${getViteBasePath()}/botlegger-logo.png`}
      alt=""
      width={size}
      height={size}
      decoding="async"
    />
  )
}

/** Generic PDF file mark: white "PDF" on a red page with a folded corner. */
export function PdfIcon({ size = 22, className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <path fill="#e2231a" d="M5 1h10l6 6v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2z" />
      <path fill="#ff8a80" d="M15 1v4a2 2 0 0 0 2 2h4z" />
      <path
        fill="none"
        stroke="#fff"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5.5 18.5v-6h2a1.6 1.6 0 0 1 0 3.2h-2M10.3 18.5v-6h1a3 3 0 0 1 0 6zM16.6 18.5v-6h2.9M16.6 15.4h2.3"
      />
    </svg>
  )
}

const ICON_BY_BRAND = {
  github: GitHubIcon,
  vscode: VSCodeIcon,
  openvsx: OpenVsxIcon,
  wyvern: WyvernIcon,
  pdf: PdfIcon,
} as const

/** The brand logo for a link's destination, or nothing when the host has no known logo. */
export function LinkBrandIcon({ href, ...props }: IconProps & { href: string }) {
  const brand = linkBrandForHref(href)
  if (!brand) return null
  const Icon = ICON_BY_BRAND[brand]
  return <Icon {...props} />
}
