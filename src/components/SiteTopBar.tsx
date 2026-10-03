import { Link } from 'react-router-dom'
import { SOCIAL } from '../config/site'
import { GitHubIcon, LinkedInIcon, WyvernIcon } from './BrandIcons'
import { SiteSearch } from './SiteSearch'

export function SiteTopBar() {
  return (
    <div className="site-top-bar">
      <Link className="site-top-bar__brand" to="/">
        Ron Picard
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
