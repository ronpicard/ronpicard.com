import { useEffect, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { SOCIAL } from '../config/site'
import { GitHubIcon, LinkedInIcon, WyvernIcon } from './BrandIcons'
import { SiteSearch } from './SiteSearch'

/** The rp monogram: a lowercase r whose arm runs into the p's stem and bowl. */
function BrandMark() {
  return (
    <svg
      className="site-top-bar__mark"
      viewBox="8 10 48 50"
      fill="none"
      stroke="currentColor"
      strokeWidth="7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M16 47V29a10 10 0 0 1 10-10h7M33 19v34M33 19h6a10 10 0 0 1 0 20h-6" />
    </svg>
  )
}

const BRAND_NAME = 'Ron Picard'

/** The name types out once per page load; later in-app navigations show it already typed. */
let brandTyped = false

export function SiteTopBar() {
  const [typing] = useState(() => !brandTyped)
  useEffect(() => {
    brandTyped = true
  }, [])

  return (
    <div className="site-top-bar">
      <Link
        className={`site-top-bar__brand${typing ? ' site-top-bar__brand--typing' : ''}`}
        to="/"
        aria-label={BRAND_NAME}
      >
        <BrandMark />
        <span className="site-top-bar__name" aria-hidden="true">
          {[...BRAND_NAME].map((char, i) => (
            <span
              key={i}
              className="site-top-bar__char"
              style={{ '--i': i } as CSSProperties}
            >
              {char}
            </span>
          ))}
        </span>
      </Link>
      <nav className="site-top-bar__social" aria-label="Site and social">
        <SiteSearch />
        <a
          className="site-top-bar__icon"
          href={SOCIAL.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn"
        >
          <LinkedInIcon className="site-top-bar__logo" size={26} />
        </a>
        <a
          className="site-top-bar__icon"
          href={SOCIAL.github}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub"
        >
          <GitHubIcon className="site-top-bar__logo" size={26} />
        </a>
        <a
          className="site-top-bar__icon"
          href={SOCIAL.wyvern}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Wyvern Systems"
        >
          <WyvernIcon className="site-top-bar__logo site-top-bar__wyvern" size={28} />
        </a>
      </nav>
    </div>
  )
}
