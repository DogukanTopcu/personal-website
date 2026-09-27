import { ArrowRight, ArrowUpRight, PushPin } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Reveal } from "@/components/site/Reveal";
import { listCourses } from "@/lib/data/courses";
import { listExperiences } from "@/lib/data/experiences";
import { listGalleries, listGalleryItems } from "@/lib/data/gallery";
import { listPosts } from "@/lib/data/posts";
import { listProjects } from "@/lib/data/projects";
import { listPublications } from "@/lib/data/publications";
import { contactHref, getSettings } from "@/lib/data/settings";
import { listStories } from "@/lib/data/stories";
import { formatMonthYear, yearOf, yearRange } from "@/lib/format";
import { CONTACT_LABEL, siteUrl } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

function Section({ id, title, href, more, children }: { id: string; title: string; href: string; more: string; children: ReactNode }) {
  return (
    <section className="home-section" aria-labelledby={id}>
      <div className="home-section__head">
        <h2 className="home-section__title" id={id}>
          {title}
        </h2>
        <Link className="home-section__more" href={href}>
          {more}
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
      {children}
    </section>
  );
}

export default async function HomePage() {
  const [settings, experiences, posts, courses, projects, stories, publications, galleries, shots] = await Promise.all([
    getSettings(),
    listExperiences(),
    listPosts({ limit: 5, featuredFirst: true }),
    listCourses({ limit: 3, featuredFirst: true }),
    listProjects({ limit: 4, featuredFirst: true }),
    listStories({ limit: 2, featuredFirst: true }),
    listPublications(),
    listGalleries(),
    listGalleryItems({ limit: 4, featuredFirst: true }),
  ]);

  const name = settings.full_name || "Doğukan Topçu";
  const firstName = name.split(/\s+/)[0];
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2);
  const current = experiences.filter((e) => e.is_current);
  const degree = experiences.find((e) => e.kind === "education");
  const galleryOf = new Map(galleries.map((g) => [g.id, g.slug]));
  // "Featured" in the admin means "listed first here"; the sort is stable, so the rest keep their order.
  const papers = [...publications].sort((a, b) => Number(b.featured) - Number(a.featured)).slice(0, 3);

  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    url: siteUrl(settings.site_url),
    ...(current[0] ? { jobTitle: current[0].title, worksFor: { "@type": "Organization", name: current[0].organization } } : {}),
    ...(settings.location ? { homeLocation: settings.location } : {}),
    sameAs: settings.socials.map((s) => s.url),
  };

  return (
    <div className="wrap home">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(person) }} />

      <section className="home-intro" aria-labelledby="hello">
        <div className="home-intro__avatar">
          {settings.avatar_url ? (
            <Image src={settings.avatar_url} alt={settings.avatar_alt || name} width={112} height={112} priority />
          ) : (
            <span aria-hidden="true">{initials}</span>
          )}
        </div>

        <h1 className="t-display home-intro__title" id="hello">
          Hi, I&apos;m {firstName}.
        </h1>
        {settings.intro && <p className="t-lede home-intro__lede">{settings.intro}</p>}

        <dl className="home-facts">
          {current.length > 0 && (
            <div>
              <dt>Now</dt>
              <dd>
                {current.map((role) => (
                  <span key={role.id}>
                    {role.title} at {role.url ? <a className="link" href={role.url} target="_blank" rel="noopener noreferrer">{role.organization}</a> : role.organization}
                  </span>
                ))}
              </dd>
            </div>
          )}
          {degree && (
            <div>
              <dt>Studied</dt>
              <dd>
                <span>
                  {degree.title}, {degree.organization}
                  {degree.end_date ? `, ${yearOf(degree.end_date)}` : ""}
                </span>
              </dd>
            </div>
          )}
          {settings.location && (
            <div>
              <dt>Based in</dt>
              <dd>
                <span>{settings.location}</span>
              </dd>
            </div>
          )}
          {settings.socials.length > 0 && (
            <div>
              <dt>Elsewhere</dt>
              <dd>
                <ul className="home-links">
                  {settings.socials.map((social) => (
                    <li key={social.url}>
                      <a href={social.url} target="_blank" rel="me noopener noreferrer">
                        {social.label}
                        <ArrowUpRight size={12} aria-hidden="true" />
                      </a>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          )}
        </dl>

        <div className="home-intro__actions">
          <a className="btn btn--primary" href={contactHref(settings)}>
            {CONTACT_LABEL}
          </a>
          <Link className="btn" href="/about">
            More about me
          </Link>
        </div>
      </section>

      <Reveal>
        {posts.length > 0 && (
          <Section id="home-writing" title="Writing" href="/blog" more="All writing">
            <ul className="rows">
              {posts.map((post) => (
                <li key={post.id}>
                  <Link className="row" href={`/blog/${post.slug}`}>
                    <span className="row__title">{post.title}</span>
                    <span className="row__meta">
                      {post.featured && (
                        <span className="row__pin" title="Pinned">
                          <PushPin size={12} aria-hidden="true" />
                          <span className="sr-only">Pinned, </span>
                        </span>
                      )}
                      <time dateTime={post.published_at ?? undefined}>{formatMonthYear(post.published_at)}</time>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {courses.length > 0 && (
          <Section id="home-courses" title="Courses" href="/courses" more="All courses">
            <ul className="rows">
              {courses.map((course) => (
                <li key={course.id}>
                  <Link className="row" href={`/courses/${course.slug}`}>
                    <span className="row__title">{course.title}</span>
                    <span className="row__meta">{course.lessons.length > 0 ? plural(course.lessons.length, "lesson") : "Soon"}</span>
                    {course.summary && <span className="row__sub">{course.summary}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {projects.length > 0 && (
          <Section id="home-projects" title="Projects" href="/projects" more="All projects">
            <ul className="rows">
              {projects.map((project) => (
                <li key={project.id}>
                  <Link className="row" href={`/projects/${project.slug}`}>
                    <span className="row__title">{project.title}</span>
                    <span className="row__meta">{yearRange(project.started_on, project.ended_on, project.is_ongoing) || project.category?.name}</span>
                    {project.summary && <span className="row__sub">{project.summary}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {stories.length > 0 && (
          <Section id="home-stories" title="Stories" href="/stories" more="All stories">
            <ul className="rows">
              {stories.map((story) => (
                <li key={story.id}>
                  <Link className="row" href={`/stories/${story.slug}`}>
                    <span className="row__title">{story.title}</span>
                    <span className="row__meta">{plural(story.chapters.length, "chapter")}</span>
                    {story.synopsis && <span className="row__sub">{story.synopsis}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {papers.length > 0 && (
          <Section id="home-research" title="Research" href="/research" more="All research">
            <ul className="rows">
              {papers.map((paper) => (
                <li key={paper.id}>
                  <Link className="row" href={`/research#${paper.slug}`}>
                    <span className="row__title">{paper.title}</span>
                    <span className="row__meta">{paper.year}</span>
                    {paper.venue && <span className="row__sub">{paper.venue}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {shots.length > 0 && (
          <Section id="home-gallery" title="Gallery" href="/gallery" more="The gallery">
            <ul className="home-gallery">
              {shots.map((shot) => (
                <li key={shot.id}>
                  <Link href={`/gallery/${galleryOf.get(shot.gallery_id) ?? ""}`} aria-label={shot.title || "Open the gallery"}>
                    {shot.media_type === "video" ? (
                      <video src={shot.media_url} poster={shot.poster_url ?? undefined} muted playsInline preload="metadata" aria-hidden="true" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={shot.media_url} alt={shot.alt || shot.title} loading="lazy" decoding="async" />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </Reveal>
    </div>
  );
}
