import type { Metadata } from "next";
import Link from "next/link";
import { Empty } from "@/components/site/Empty";
import { Frame } from "@/components/site/Frame";
import { Lamp } from "@/components/site/Lamp";
import { PageHead } from "@/components/site/PageHead";
import { Reveal } from "@/components/site/Reveal";
import { listCategories } from "@/lib/data/categories";
import { listProjects } from "@/lib/data/projects";
import type { ProjectCard } from "@/lib/data/types";
import { yearRange } from "@/lib/format";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Work",
  description: "Software, games, robotics and machine learning projects.",
  alternates: { canonical: "/projects" },
};

/** Discipline and years, as they are printed under a still. */
function caption(project: ProjectCard) {
  const years = project.started_on || project.ended_on || project.is_ongoing ? yearRange(project.started_on, project.ended_on, project.is_ongoing) : "";
  return [project.category?.name, years].filter(Boolean).join(" · ");
}

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
        title="Work"
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
            {/* The lead project is projected: a wide gate, its caption in the
                masking beside it. The title's link covers the whole entry. */}
            <article className="lead-plate">
              <Lamp className="lead-plate__gate">
                <Frame
                  src={lead.cover_url ?? lead.category?.cover_url}
                  alt={lead.cover_alt}
                  placeholder={`Cover for ${lead.title}`}
                  titleCard={lead.title}
                  ratio={null}
                  className="gate card-fit card-fit--wide"
                  sizes="(min-width: 1100px) 62vw, 100vw"
                  priority
                />
              </Lamp>
              <div className="lead-plate__caption">
                {caption(lead) && <p className="t-label">{caption(lead)}</p>}
                <h2 className="lead-plate__title">
                  <Link href={`/projects/${lead.slug}`}>{lead.title}</Link>
                </h2>
                <p className="lead-plate__summary">{lead.summary}</p>
                {lead.tech.length > 0 && (
                  <ul className="tags">
                    {lead.tech.slice(0, 6).map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                )}
              </div>
            </article>

            {/* The rest are stills, hung unevenly on purpose: a wide one and a
                narrow one to a row, the narrow one lower, alternating sides. */}
            {rest.length > 0 && (
              <Reveal className="plate-grid" as="ul" stagger={80}>
                {rest.map((project) => (
                  <li key={project.id}>
                    <article className="plate">
                      <Lamp>
                        <Frame
                          src={project.cover_url ?? project.category?.cover_url}
                          alt={project.cover_alt}
                          placeholder={`Cover for ${project.title}`}
                          titleCard={project.title}
                          ratio="3 / 2"
                          className="card-fit"
                          sizes="(min-width: 1100px) 50vw, (min-width: 700px) 55vw, 100vw"
                        />
                      </Lamp>
                      <div className="plate__caption">
                        {caption(project) && <p className="t-label">{caption(project)}</p>}
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
