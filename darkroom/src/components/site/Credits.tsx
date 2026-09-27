import Link from "next/link";
import { contactHref, getSettings } from "@/lib/data/settings";
import { CONTACT_LABEL, NAV } from "@/lib/site";

/**
 * The end credits: role on the left, name on the right, meeting at the centre,
 * the way closing credits are set. Every page ends here.
 */
export async function Credits({ hard = false }: { hard?: boolean }) {
  const settings = await getSettings();
  const name = settings.full_name || "Doğukan Topçu";
  const Anchor = hard ? "a" : Link;

  return (
    <footer className="credits">
      <div className="wrap">
        <p className="t-label">Written and built by</p>
        <p className="credits__name">{name}</p>

        <ul className="credits__rows">
          {settings.headline && (
            <li className="credits__row">
              <p className="credits__role">In short</p>
              <p className="credits__value">{settings.headline}</p>
            </li>
          )}
          {settings.location && (
            <li className="credits__row">
              <p className="credits__role">Based in</p>
              <p className="credits__value">{settings.location}</p>
            </li>
          )}
          {settings.socials.length > 0 && (
            <li className="credits__row">
              <p className="credits__role">Elsewhere</p>
              <p className="credits__value">
                {settings.socials.map((social) => (
                  <a key={social.url} className="link" href={social.url} target="_blank" rel="me noopener noreferrer">
                    {social.label}
                  </a>
                ))}
              </p>
            </li>
          )}
          <li className="credits__row">
            <p className="credits__role">On this site</p>
            <p className="credits__value">
              {NAV.map((item) => (
                <Anchor key={item.href} className="link" href={item.href}>
                  {item.label}
                </Anchor>
              ))}
              <Anchor className="link" href="/search">
                Search
              </Anchor>
            </p>
          </li>
        </ul>

        <div className="credits__cta">
          <a className="btn btn--primary" href={contactHref(settings)}>
            {CONTACT_LABEL}
          </a>
        </div>
        <p className="t-label credits__small">
          <span className="nums">{new Date().getUTCFullYear()}</span>
        </p>
      </div>
    </footer>
  );
}
