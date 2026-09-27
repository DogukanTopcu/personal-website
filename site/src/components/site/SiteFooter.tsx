import { ArrowUpRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { contactHref, getSettings } from "@/lib/data/settings";
import { CONTACT_LABEL, SECTIONS } from "@/lib/site";

export async function SiteFooter() {
  const settings = await getSettings();
  const name = settings.full_name || "Doğukan Topçu";

  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="site-footer__grid">
          <div className="site-footer__about">
            <p className="site-footer__name">{name}</p>
            {settings.headline && <p className="site-footer__line">{settings.headline}</p>}
            {settings.location && <p className="site-footer__line">{settings.location}</p>}
            <a className="btn site-footer__cta" href={contactHref(settings)}>
              {CONTACT_LABEL}
            </a>
          </div>

          <nav aria-label="Site">
            <p className="t-label site-footer__title">Site</p>
            <ul className="site-footer__links">
              <li>
                <Link href="/">Home</Link>
              </li>
              {SECTIONS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
              <li>
                <Link href="/search">Search</Link>
              </li>
            </ul>
          </nav>

          <nav aria-label="Elsewhere">
            <p className="t-label site-footer__title">Elsewhere</p>
            <ul className="site-footer__links">
              {settings.socials.map((social) => (
                <li key={social.url}>
                  <a href={social.url} target="_blank" rel="me noopener noreferrer">
                    {social.label}
                    <ArrowUpRight size={12} aria-hidden="true" />
                  </a>
                </li>
              ))}
              <li>
                <a href="/feed.xml">RSS feed</a>
              </li>
            </ul>
          </nav>
        </div>

        <p className="site-footer__base">
          <span className="nums">© {new Date().getUTCFullYear()}</span> {name}
        </p>
      </div>
    </footer>
  );
}
