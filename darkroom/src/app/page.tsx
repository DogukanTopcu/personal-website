import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Bar } from "@/components/site/Bar";
import { Frame } from "@/components/site/Frame";
import { DevelopPrint } from "@/home/DevelopPrint";
import { EngineMount } from "@/home/EngineMount";
import { InView } from "@/home/InView";
import { buildScreeningCopy } from "@/home/copy";
import { greaseLoop } from "@/home/grease";
import "@/home/home.css";
import { listCourses } from "@/lib/data/courses";
import { listExperiences } from "@/lib/data/experiences";
import { listGalleries, listGalleryItems } from "@/lib/data/gallery";
import { listPosts } from "@/lib/data/posts";
import { listProjects } from "@/lib/data/projects";
import { listPublications } from "@/lib/data/publications";
import { contactHref, getSettings } from "@/lib/data/settings";
import { listStories } from "@/lib/data/stories";
import { yearOf } from "@/lib/format";
import { CONTACT_LABEL } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/** The stand-in print, until one of his own photographs is marked as featured. */
const STOCK_PRINT = {
  src: "/film/kordon-print.jpg",
  srcMobile: "/film/kordon-print-m.jpg",
  ratio: 2400 / 1600,
  alt: "The old tram on the Kordon in İzmir at dusk, street lamps lit, people sitting on the sea wall.",
  credit: "Photograph by Elevandos Medya on Unsplash. The Kordon, İzmir.",
};

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/**
 * Credit windows. Credits fade through black, one card at a time: a card has
 * gone before the next arrives, because two names dissolving through each
 * other in the same place read as a double exposure, not as credits.
 */
function creditWindows(count: number): string[] {
  const share = 1 / count;
  const ramp = 0.18;
  return Array.from({ length: count }, (_, i) => {
    const from = i * share;
    const to = (i + 1) * share;
    if (i === 0) return `0 ${to.toFixed(3)} 0 ${ramp}`; // greet: present as the stage arrives
    return `${from.toFixed(3)} ${to.toFixed(3)} ${ramp} ${ramp}`; // the last one closes by 1: not the last act
  });
}

export default async function HomePage() {
  const [settings, experiences, projects, posts, courses, stories, publications, galleries, featured] = await Promise.all([
    getSettings(),
    listExperiences(),
    listProjects(),
    listPosts(),
    listCourses(),
    listStories(),
    listPublications(),
    listGalleries(),
    listGalleryItems({ featured: true }),
  ]);

  const copy = buildScreeningCopy(settings, experiences);
  const contact = contactHref(settings);
  const name = settings.full_name || "Doğukan Topçu";
  const lessons = courses.reduce((n, c) => n + c.lessons.length, 0);

  // His own photograph develops in the tray as soon as there is one.
  const own = featured.find((item) => item.media_type === "image");
  const print = own
    ? {
        src: own.media_url,
        srcMobile: undefined,
        ratio: own.width && own.height ? own.width / own.height : 3 / 2,
        alt: own.alt || own.title || "A photograph by Doğukan Topçu",
        credit: `Photograph by ${name}${own.title ? `. ${own.title}` : ""}.`,
      }
    : STOCK_PRINT;

  const programme = [
    ...courses.slice(0, 2).map((c) => ({
      kind: "Course",
      title: c.title,
      href: `/courses/${c.slug}`,
      runtime: `${plural(c.lessons.length, "lesson")}, ${c.lessons.reduce((n, l) => n + (l.reading_minutes ?? 1), 0)} min`,
    })),
    ...posts.slice(0, 3).map((p) => ({
      kind: p.review?.subject ? "Review" : "Essay",
      title: p.title,
      href: `/blog/${p.slug}`,
      runtime: `${p.reading_minutes ?? 1} min`,
    })),
    ...stories.slice(0, 1).map((s) => ({
      kind: "Story",
      title: s.title,
      href: `/stories/${s.slug}`,
      runtime: `${plural(s.chapters.length, "chapter")}, ${s.chapters.reduce((n, ch) => n + (ch.reading_minutes ?? 1), 0)} min`,
    })),
  ];

  const contactEdge = settings.email || settings.socials[0]?.label || "Email";
  const sheet: { label: string; href: string; edge: string; marked?: boolean }[][] = [
    [
      { label: "Work", href: "/projects", edge: plural(projects.length, "project") },
      { label: "Writing", href: "/blog", edge: plural(posts.length, "essay and review", "essays and reviews") },
      { label: "Courses", href: "/courses", edge: `${plural(courses.length, "course")}, ${plural(lessons, "lesson")}` },
    ],
    [
      { label: "Stories", href: "/stories", edge: plural(stories.length, "story", "stories") },
      { label: "Research", href: "/research", edge: plural(publications.length, "publication") },
      { label: "Gallery", href: "/gallery", edge: plural(galleries.length, "gallery", "galleries") },
    ],
    [
      { label: "About", href: "/about", edge: settings.location || "Profile" },
      { label: "Search", href: "/search", edge: "Full text" },
      { label: CONTACT_LABEL, href: contact, edge: contactEdge, marked: true },
    ],
  ];

  const credits = [...copy.credits];
  const windows = creditWindows(credits.length + 1);
  const grease = greaseLoop(11);

  return (
    <>
      <a className="skip-to-content" href="#screening">
        Skip to content
      </a>
      <Bar over wordmark={name} contactHref={contact} />
      <span data-sc-progress aria-hidden="true" />

      <main id="screening" className="screening">
        {/* ------------------------------------------------ 1. the opening -- */}
        <section className="scene opening" data-sc-act="scrub" data-sc-span="2.2" data-sc-dwell="0.3" aria-labelledby="opening-title">
          <div data-sc-stage className="opening__stage">
            <div className="opening__screen">
              <div className="gate opening__gate">
                <picture>
                  <source media="(max-width: 860px) and (orientation: portrait)" srcSet="/film/projector-poster-p.jpg" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="sc-stage__poster" src="/film/projector-poster.jpg" alt="" fetchPriority="high" />
                </picture>
                <video
                  data-sc-scrub
                  data-src-wide="/film/projector.mp4"
                  data-src-tall="/film/projector-p.mp4"
                  muted
                  playsInline
                  preload="none"
                  aria-hidden="true"
                />
              </div>
            </div>

            <div className="opening__titles" data-sc-cue="0 0.7 0">
              <h1 id="opening-title" className="t-marquee opening__name">
                {copy.title.heading}
              </h1>
              <div className="opening__side">
                <p className="t-lede opening__line">{copy.title.body}</p>
                <div className="opening__actions">
                  <a className="btn btn--primary" href={contact}>
                    {CONTACT_LABEL}
                  </a>
                  <a className="btn" href="/projects">
                    See the work
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ 2. the credits -- */}
        <section className="scene credits-scene" data-sc-act="pin" data-sc-span="2.6" aria-labelledby="credits-title">
          <div data-sc-stage className="credits-scene__stage">
            <h2 id="credits-title" className="sr-only">
              Credits
            </h2>
            {credits.map((credit, i) => (
              <div key={`${credit.role}-${credit.name}`} className="credit" data-sc-cue={windows[i]}>
                <p className="t-label credit__role">{credit.role}</p>
                <p className="credit__name">{credit.name}</p>
                {credit.note && <p className="credit__note">{credit.note}</p>}
              </div>
            ))}
            <div className="credit credit--close" data-sc-cue={windows[credits.length]}>
              <p className="credit__name credit__name--close">{copy.creditsClose.heading}</p>
              <p className="t-lede credit__body">{copy.creditsClose.body}</p>
              <a className="link credit__link" href="/about">
                Read the long version
              </a>
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------- 3. the work -- */}
        <section className="scene work" data-sc-act="pan" data-sc-span="2.2" aria-labelledby="work-title">
          <div data-sc-stage className="work__stage">
            <div className="work__rail" data-sc-pan="0.04">
              <div className="work__lead">
                <h2 id="work-title" className="t-h2">
                  {copy.work.heading}
                </h2>
                <p className="t-lede work__body">{copy.work.body}</p>
              </div>

              <ol className="work__film">
                {projects.map((project, i) => (
                  <li key={project.id} className="shot" style={{ "--i": i } as CSSProperties}>
                    <div className="shot__film strip">
                      <a className="shot__frame" href={`/projects/${project.slug}`} aria-label={project.title}>
                        <Frame
                          src={project.cover_url ?? project.category?.cover_url}
                          alt={project.cover_alt}
                          placeholder={`Cover for ${project.title}`}
                          titleCard={project.title}
                          ratio="3 / 2"
                          sizes="(min-width: 900px) 34vw, 80vw"
                        />
                      </a>
                      <span className="edge-print shot__edge">
                        {[project.category?.name, project.is_ongoing ? "Ongoing" : yearOf(project.ended_on ?? project.started_on ?? project.published_at)]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </div>
                    <div className="shot__caption">
                      <h3 className="shot__title">
                        <a href={`/projects/${project.slug}`}>{project.title}</a>
                      </h3>
                      <p className="shot__summary">{project.summary}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className="work__end">
                <p className="t-label">The whole reel</p>
                <a className="btn" href="/projects">
                  All projects
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ 4. the programme -- */}
        <section className="scene programme" aria-labelledby="programme-title">
          <div className="wrap programme__grid">
            <div className="programme__head" data-sc-in>
              <h2 id="programme-title" className="t-h2">
                {copy.writing.heading}
              </h2>
              <p className="t-lede programme__body">{copy.writing.body}</p>
              <p className="programme__links">
                <a className="link" href="/courses">
                  Courses
                </a>
                <a className="link" href="/blog">
                  Writing
                </a>
                <a className="link" href="/stories">
                  Stories
                </a>
              </p>
            </div>

            {programme.length > 0 && (
              <ol className="programme__list" data-sc-in data-sc-stagger="55">
                {programme.map((item) => (
                  <li key={item.href} className="programme__row">
                    <span className="t-label programme__kind">{item.kind}</span>
                    <a className="programme__title" href={item.href}>
                      {item.title}
                    </a>
                    <span className="t-data programme__runtime">{item.runtime}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </section>

        {/* -------------------------------------------------- 5. the darkroom -- */}
        <section className="scene darkroom" data-sc-act="pin" data-sc-span="3.8" aria-labelledby="darkroom-title">
          <div data-sc-stage className="darkroom__stage">
            <div className="darkroom__red" aria-hidden="true" />
            <div className="darkroom__lamp" aria-hidden="true" />
            <div className="darkroom__layout">
              <div className="darkroom__tray">
                <DevelopPrint src={print.src} srcMobile={print.srcMobile} alt={print.alt} ratio={print.ratio} />
              </div>
              <div className="darkroom__caption" data-sc-cue="0.76 1 0.14 0.12">
                <h2 id="darkroom-title" className="t-h2">
                  {copy.gallery.heading}
                </h2>
                <p className="t-lede darkroom__body">{copy.gallery.body}</p>
                <a className="btn darkroom__cta" href="/gallery">
                  See the gallery
                </a>
                <p className="t-caption darkroom__credit">{print.credit}</p>
              </div>
            </div>
          </div>
        </section>

        {/* --------------------------------------------- 6. the contact sheet -- */}
        <section className="scene sheet" aria-labelledby="sheet-title">
          <div className="wrap sheet__grid">
            <div className="sheet__side">
              <div className="sheet__head" data-sc-in>
                <h2 id="sheet-title" className="t-h2">
                  {copy.sheet.heading}
                </h2>
                <p className="t-lede sheet__body">{copy.sheet.body}</p>
              </div>

              <div className="sheet__foot">
                {settings.socials.length > 0 && (
                  <p className="sheet__elsewhere">
                    <span className="t-label">Elsewhere</span>
                    {settings.socials.map((social) => (
                      <a key={social.url} className="link" href={social.url} target="_blank" rel="me noopener noreferrer">
                        {social.label}
                      </a>
                    ))}
                  </p>
                )}
                <p className="t-label">
                  {name}
                  {settings.location ? `, ${settings.location}` : ""}. <span className="nums">{new Date().getUTCFullYear()}</span>
                </p>
              </div>
            </div>

            <InView className="sheet__paper" threshold={0.4}>
              {sheet.map((row, r) => (
                <ol key={r} className="sheet__strip strip">
                  {row.map((cell) => (
                    <li key={cell.label} className="sheet__cell" data-marked={cell.marked ? "true" : undefined}>
                      <a className="sheet__frame" href={cell.href}>
                        <span className="title-card">
                          <span className="title-card__text">{cell.label}</span>
                        </span>
                      </a>
                      <span className="edge-print sheet__edge">{cell.edge}</span>
                      {cell.marked && (
                        <svg className="grease" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                          <path d={grease} pathLength={1} />
                        </svg>
                      )}
                    </li>
                  ))}
                </ol>
              ))}
            </InView>
          </div>
        </section>
      </main>

      <EngineMount />
    </>
  );
}
