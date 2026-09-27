import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Prose } from "@/components/content/Markdown";
import { Toc } from "@/components/content/Toc";
import { Frame } from "@/components/site/Frame";
import { Lamp } from "@/components/site/Lamp";
import { PageHead } from "@/components/site/PageHead";
import { Shots } from "@/components/site/Shots";
import { listProjects, getProject } from "@/lib/data/projects";
import { formatDate, yearRange } from "@/lib/format";
import { renderMarkdown } from "@/lib/markdown/render";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  const projects = await listProjects();
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const project = await getProject(slug);
  if (!project) return { title: "Not found" };
  return {
    title: project.title,
    description: project.summary,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: {
      type: "article",
      title: project.title,
      description: project.summary,
      ...(project.cover_url ? { images: [project.cover_url] } : {}),
    },
  };
}

export default async function ProjectPage(props: PageProps<"/projects/[slug]">) {
  const { slug } = await props.params;
  const project = await getProject(slug);
  if (!project) notFound();

  const { content, toc } = await renderMarkdown(project.content_md);
  const dates = yearRange(project.started_on, project.ended_on, project.is_ongoing);

  return (
    <>
      <PageHead
        crumbs={[{ href: "/projects", label: "Work" }, { label: project.title }]}
        title={project.title}
        lede={project.summary}
      />

      <div className="wrap">
        {/* The still: the cover in a wide gate, or the project's own title
            card when it has no picture yet. */}
        <Lamp className="detail-gate">
          <Frame
            src={project.cover_url ?? project.category?.cover_url}
            alt={project.cover_alt}
            placeholder={`Cover for ${project.title}`}
            titleCard={project.title}
            ratio={null}
            className="gate card-fit card-fit--wide"
            sizes="(min-width: 1360px) 1250px, 100vw"
            priority
          />
        </Lamp>

        <div className="reading">
          <div>
            <dl className="facts detail-facts">
              {project.category && (
                <div className="facts__row">
                  <dt className="facts__key">Field</dt>
                  <dd className="facts__value">
                    <Link className="link" href={`/projects?category=${project.category.slug}`}>
                      {project.category.name}
                    </Link>
                  </dd>
                </div>
              )}
              {project.role && (
                <div className="facts__row">
                  <dt className="facts__key">Role</dt>
                  <dd className="facts__value">{project.role}</dd>
                </div>
              )}
              {dates && (
                <div className="facts__row">
                  <dt className="facts__key">When</dt>
                  <dd className="facts__value nums">{dates}</dd>
                </div>
              )}
              {project.tech.length > 0 && (
                <div className="facts__row">
                  <dt className="facts__key">Built with</dt>
                  <dd className="facts__value">{project.tech.join(", ")}</dd>
                </div>
              )}
              {(project.repo_url || project.live_url) && (
                <div className="facts__row">
                  <dt className="facts__key">Links</dt>
                  <dd className="facts__value link-row">
                    {project.repo_url && (
                      <a className="link" href={project.repo_url} target="_blank" rel="noopener noreferrer">
                        Source
                      </a>
                    )}
                    {project.live_url && (
                      <a className="link" href={project.live_url} target="_blank" rel="noopener noreferrer">
                        Live
                      </a>
                    )}
                  </dd>
                </div>
              )}
            </dl>

            {content && <Prose className="detail-prose">{content}</Prose>}

            <p className="t-caption detail-updated">
              Last updated <time dateTime={project.updated_at}>{formatDate(project.updated_at)}</time>.
            </p>
          </div>

          <aside className="reading__aside">
            <Toc entries={toc} />
          </aside>
        </div>
      </div>

      <Shots shots={project.gallery} of={project.title} />
    </>
  );
}
