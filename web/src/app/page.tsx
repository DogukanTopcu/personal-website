import type { Metadata } from "next";
import Link from "next/link";
import { InlineScript } from "@/components/site/InlineScript";
import { FlightMount } from "@/home/FlightMount";
import { MapRail } from "@/home/MapRail";
import { SheetStage } from "@/home/SheetStage";
import { buildCopy, type HomeCounts } from "@/home/copy";
import "@/home/home.css";
import { ConstructionSvg } from "@/home/svg";
import { buildWorld } from "@/home/world/constructions";
import { COPY_SIDE, LEGS, copyWindow } from "@/home/world/flight";
import { listCourses } from "@/lib/data/courses";
import { listGalleryItems } from "@/lib/data/gallery";
import { listPosts } from "@/lib/data/posts";
import { listProjects } from "@/lib/data/projects";
import { listPublications } from "@/lib/data/publications";
import { contactHref, getSettings } from "@/lib/data/settings";
import { listStories } from "@/lib/data/stories";
import { CONTACT_LABEL, NAV } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/**
 * The flight is an enhancement. Without JavaScript, or when the visitor asks
 * for reduced motion, the static sheet below is what renders, with every
 * construction already inked. This runs before the first paint, so neither
 * tree ever flashes.
 */
const flightScript = `(function(){try{if(!matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.setAttribute("data-flight","on")}catch(e){}})()`;

export default async function HomePage() {
  const [settings, projects, posts, courses, stories, publications, galleryItems] = await Promise.all([
    getSettings(),
    listProjects(),
    listPosts(),
    listCourses(),
    listStories(),
    listPublications(),
    listGalleryItems(),
  ]);

  const counts: HomeCounts = {
    projects: projects.length,
    posts: posts.length,
    courses: courses.length,
    lessons: courses.reduce((n, c) => n + c.lessons.length, 0),
    stories: stories.length,
    publications: publications.length,
    galleryItems: galleryItems.length,
  };

  const copy = buildCopy(settings, counts);
  const world = buildWorld();
  const name = settings.full_name || "Doğukan Topçu";
  const contact = contactHref(settings);
  const [hero, ...rest] = copy;
  const middle = rest.slice(0, -1);
  const finale = copy[copy.length - 1];

  return (
    <>
      <InlineScript html={flightScript} />
      <a className="skip-link link" href="#sheet-contents">
        Skip to contents
      </a>

      {/* --------------------------------------------------------- the flight -- */}
      <div className="flight" data-sheet-host>
        <MapRail labels={copy.map((c) => c.label)} />
        <span data-sc-progress aria-hidden="true" />

        <div data-sc-mode="worldflight" data-sc-seam="0.16" data-sc-lerp="0.12">
          <div data-sc-world>
            <SheetStage reducedMotionFallback />
            {/* The legs carry the weights and the labels. The drawing is the canvas above. */}
            {copy.map((waypoint, index) => (
              <div key={waypoint.key} data-sc-segment data-sc-w={LEGS[index]} data-sc-waypoint={waypoint.label} aria-hidden="true" />
            ))}
          </div>

          <div data-sc-world-copy>
            <div className="flight-scrim" aria-hidden="true" />

            <div className="hero-copy" data-sc-copy data-sc-window={copyWindow(0)}>
              <h1 className="t-display hero-copy__name">{hero.heading}</h1>
              <p className="t-lede hero-copy__line">{hero.body}</p>
              <div className="hero-copy__actions">
                <a className="btn btn--primary" href={contact}>
                  {CONTACT_LABEL}
                </a>
                <Link className="btn" href="/projects">
                  See the work
                </Link>
              </div>
            </div>

            {middle.map((waypoint, i) => (
              <div
                key={waypoint.key}
                className="flight-copy"
                data-side={COPY_SIDE[i + 1]}
                data-sc-copy
                data-sc-window={copyWindow(i + 1)}
              >
                <h2 className="t-h2 flight-copy__heading">{waypoint.heading}</h2>
                <p className="t-lede flight-copy__body">{waypoint.body}</p>
                {waypoint.links.length > 0 && (
                  <ul className="flight-copy__links">
                    {waypoint.links.map((link) => (
                      <li key={link.href}>
                        <Link className="link t-small" href={link.href}>
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}

            <div className="title-block" data-sc-copy data-sc-window={copyWindow(copy.length - 1)}>
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
                <span className="t-small">{finale.body}</span>
                <a className="btn btn--primary" href={contact}>
                  {CONTACT_LABEL}
                </a>
              </div>
            </div>
          </div>

          <div data-sc-spacer aria-hidden="true" />
        </div>
        <FlightMount />
      </div>

      {/* ---------------------------------------------------- the static sheet -- */}
      <main className="static-sheet" id="sheet-contents">
        <header className="wrap section" style={{ paddingBottom: 0 }}>
          <h1 className="t-display">{hero.heading}</h1>
          <p className="t-lede" style={{ marginTop: "1.1rem" }}>
            {hero.body}
          </p>
          <div className="hero-copy__actions">
            <a className="btn btn--primary" href={contact}>
              {CONTACT_LABEL}
            </a>
            <Link className="btn" href="/projects">
              See the work
            </Link>
          </div>
        </header>

        {middle.map((waypoint, i) => (
          <section key={waypoint.key} className="static-sheet__section">
            <div className="wrap static-sheet__grid" data-side={COPY_SIDE[i + 1]}>
              <div>
                <h2 className="t-h2">{waypoint.heading}</h2>
                <p className="t-lede" style={{ marginTop: "1rem" }}>
                  {waypoint.body}
                </p>
                {waypoint.links.length > 0 && (
                  <ul className="flight-copy__links">
                    {waypoint.links.map((link) => (
                      <li key={link.href}>
                        <Link className="link t-small" href={link.href}>
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="static-sheet__figure">
                <ConstructionSvg construction={world.constructions[i + 1]} title={`${waypoint.heading}, drawn`} />
              </div>
            </div>
          </section>
        ))}

        <section className="static-sheet__section">
          <div className="wrap">
            <h2 className="t-h2">{finale.heading}</h2>
            <div className="title-block" style={{ position: "static", marginTop: "2rem", maxWidth: "46rem" }}>
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
                <span className="t-small">{finale.body}</span>
                <a className="btn btn--primary" href={contact}>
                  {CONTACT_LABEL}
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
