import Link from "next/link";
import { contactHref, getSettings } from "@/lib/data/settings";
import { CONTACT_LABEL, NAV } from "@/lib/site";

/** The same title block as the home page's close, so the site ends the way it began. */
export async function SiteFooter() {
  const settings = await getSettings();
  const contact = contactHref(settings);
  const name = settings.full_name || "Doğukan Topçu";

  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="title-block title-block--static">
          <div className="title-block__row">
            <div className="title-block__key">Drawing</div>
            <div className="title-block__value">
              <strong>{name}</strong>
              {settings.headline ? `. ${settings.headline}` : ""}
            </div>
          </div>
          <div className="title-block__row">
            <div className="title-block__key">Sheet</div>
            <div className="title-block__value">
              <div className="title-block__links">
                {NAV.map((item) => (
                  <Link key={item.href} className="link" href={item.href}>
                    {item.label}
                  </Link>
                ))}
                <Link className="link" href="/search">
                  Search
                </Link>
              </div>
            </div>
          </div>
          {settings.socials.length > 0 && (
            <div className="title-block__row">
              <div className="title-block__key">Elsewhere</div>
              <div className="title-block__value">
                <div className="title-block__links">
                  {settings.socials.map((social) => (
                    <a key={social.url} className="link" href={social.url} target="_blank" rel="me noopener noreferrer">
                      {social.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}
          {settings.location && (
            <div className="title-block__row">
              <div className="title-block__key">Based in</div>
              <div className="title-block__value">{settings.location}</div>
            </div>
          )}
          <div className="title-block__cta">
            <span className="t-caption">
              <span className="nums">{new Date().getUTCFullYear()}</span>. Drawn and written by {name}.
            </span>
            <a className="btn btn--primary" href={contact}>
              {CONTACT_LABEL}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
