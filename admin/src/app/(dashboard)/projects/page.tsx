import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ListToolbar } from "@/components/content/list-toolbar";
import { Pagination } from "@/components/content/pagination";
import { RowActions } from "@/components/content/row-actions";
import { LinkButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusMark } from "@/components/ui/status-mark";
import { Table, TBody, Td, Th, THead, Tr } from "@/components/ui/table";
import { Time } from "@/components/ui/time";
import { removeProject } from "@/lib/actions/projects";
import { requireAdmin } from "@/lib/auth";
import { listCategories } from "@/lib/data/categories";
import { listProjects } from "@/lib/data/projects";
import { parseListParams, type SearchParams } from "@/lib/data/shared";
import { liveOrNull, publicPaths } from "@/lib/paths";

export const metadata: Metadata = { title: "Projects" };

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;
  const list = parseListParams(params);
  const [result, categories] = await Promise.all([listProjects(supabase, list), listCategories(supabase, "project")]);
  const filtered = Boolean(list.q || list.status !== "all" || list.category);

  return (
    <div>
      <PageHeader
        eyebrow="Content"
        title="Projects"
        actions={
          <LinkButton href="/projects/new" variant="primary">
            New project
          </LinkButton>
        }
      />

      <Suspense>
        <ListToolbar q={list.q} status={list.status} category={list.category} categories={categories} total={result.total} noun="project" />
      </Suspense>

      {result.rows.length === 0 ? (
        <EmptyState action={filtered ? undefined : <LinkButton href="/projects/new" size="sm">Add the first project</LinkButton>}>
          {filtered ? "No projects match these filters." : "Software, games, robotics and research projects will be listed here."}
        </EmptyState>
      ) : (
        <Table>
          <THead>
            <Tr>
              <Th>Title</Th>
              <Th className="hidden md:table-cell">Category</Th>
              <Th>Status</Th>
              <Th className="hidden sm:table-cell">Position</Th>
              <Th className="hidden lg:table-cell">Updated</Th>
              <Th className="w-12">
                <span className="sr-only">Actions</span>
              </Th>
            </Tr>
          </THead>
          <TBody>
            {result.rows.map((project) => (
              <Tr key={project.id}>
                <Td>
                  <Link href={`/projects/${project.id}`} className="font-medium hover:underline">
                    {project.title || "Untitled"}
                  </Link>
                  <span className="mt-0.5 block font-mono text-[0.6875rem] text-ink-soft">
                    /projects/{project.slug}
                    {project.featured ? " · featured" : ""}
                  </span>
                </Td>
                <Td className="hidden text-ink-soft md:table-cell">{project.category?.name ?? "-"}</Td>
                <Td>
                  <StatusMark status={project.status} publishedAt={project.published_at} />
                </Td>
                <Td className="hidden font-mono text-xs text-ink-soft sm:table-cell">{project.position}</Td>
                <Td className="hidden font-mono text-xs text-ink-soft lg:table-cell">
                  <Time iso={project.updated_at} mode="relative" />
                </Td>
                <Td className="text-right">
                  <RowActions
                    id={project.id}
                    name={project.title || "Untitled"}
                    editHref={`/projects/${project.id}`}
                    publicPath={liveOrNull(project.status, project.published_at, publicPaths.project(project.slug))}
                    onDelete={removeProject}
                    noun="project"
                  />
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}

      <Pagination page={result.page} pageCount={result.pageCount} basePath="/projects" searchParams={params} />
    </div>
  );
}
