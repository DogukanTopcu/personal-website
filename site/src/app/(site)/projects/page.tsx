import type { Metadata } from "next";
import Link from "next/link";
import { Empty } from "@/components/site/Empty";
import { Frame } from "@/components/site/Frame";
import { PageHead } from "@/components/site/PageHead";
import { Reveal } from "@/components/site/Reveal";
import { listCategories } from "@/lib/data/categories";
import { listProjects } from "@/lib/data/projects";
import { yearRange } from "@/lib/format";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Projects",
  description: "Software, games, robotics and machine learning projects.",
  alternates: { canonical: "/projects" },
};

export default async function ProjectsPage(props: PageProps<"/projects">) {
  const [{ category }, projects, categories] = await Promise.all([
    props.searchParams,
    listProjects(),
    listCategories("project"),
  ]);

  const active = typeof category === "string" ? category : null;
  const shown = active ? projects.filter((p) => p.category?.slug === active) : projects;
  const used = categories.filter((c) => projects.some((p) => p.category?.slug === c.slug));
  const [lead, ...rest] = shown;

  return (
    <>
      <PageHead
        title="Projects"
        lede="Things I built, across the parts of engineering I keep coming back to."
        meta={
          used.length > 1 && (
            <ul className="filters">
              <li>
                <Link href="/projects" aria-current={!active ? "true" : undefined}>
                  Everything
                </Link>
              </li>
              {used.map((c) => (
                <li key={c.slug}>
                  <Link href={`/projects?category=${c.slug}`} aria-current={active === c.slug ? "true" : undefined}>
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          )
        }
      />

      <div className="wrap section">
        {shown.length === 0 ? (
          <Empty
            title={active ? "Nothing here yet" : "No projects published yet"}
            body={active ? "Nothing has been published in this discipline. Try another one." : "Write-ups of what I have built will appear here."}
          />
        ) : (
          <>
            {/* The lead project gets the room; the rest share a grid. A cover
                is shown only once one has been uploaded. */}
            <article className="lead-plate">
              {(lead.cover_url ?? lead.category?.cover_url) && (
                <Link className="lead-plate__frame" href={`/projects/${lead.slug}`} tabIndex={-1} aria-hidden="true">
                  <Frame
                    src={lead.cover_url ?? lead.category?.cover_url}
                    alt={lead.cover_alt}
                    placeholder={`Cover for ${lead.title}`}
                    ratio="16 / 10"
                    sizes="(min-width: 720px) 42rem, 100vw"
                    priority
                  />
                </Link>
              )}
              <div className="lead-plate__text">
                <p className="entry__aside">
                  {lead.category?.name}
                  {lead.started_on || lead.ended_on ? ` · ${yearRange(lead.started_on, lead.ended_on, lead.is_ongoing)}` : ""}
                </p>
                <h2 className="t-h2">
                  <Link href={`/projects/${lead.slug}`}>{lead.title}</Link>
                </h2>
                <p className="entry__body">{lead.summary}</p>
                {lead.tech.length > 0 && (
                  <ul className="tags lead-plate__tags">
                    {lead.tech.slice(0, 6).map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                )}
              </div>
            </article>

            {rest.length > 0 && (
              <Reveal className="plate-grid" as="ul" stagger={60}>
                {rest.map((project) => (
                  <li key={project.id}>
                    <article className="plate">
                      {(project.cover_url ?? project.category?.cover_url) && (
                        <Frame
                          src={project.cover_url ?? project.category?.cover_url}
                          alt={project.cover_alt}
                          placeholder={`Cover for ${project.title}`}
                          ratio="3 / 2"
                          sizes="(min-width: 720px) 21rem, 100vw"
                        />
                      )}
                      <div>
                        <p className="entry__aside">
                          {project.category?.name}
                          {project.started_on || project.ended_on ? ` · ${yearRange(project.started_on, project.ended_on, project.is_ongoing)}` : ""}
                        </p>
                        <h2 className="plate__title">
                          <Link href={`/projects/${project.slug}`}>{project.title}</Link>
                        </h2>
                        <p className="plate__body">{project.summary}</p>
                      </div>
                    </article>
                  </li>
                ))}
              </Reveal>
            )}
          </>
        )}
      </div>
    </>
  );
}
