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
import { removeCourse } from "@/lib/actions/courses";
import { requireAdmin } from "@/lib/auth";
import { listCourses } from "@/lib/data/courses";
import { parseListParams, type SearchParams } from "@/lib/data/shared";
import { liveOrNull, publicPaths } from "@/lib/paths";
import { LABELS, type CourseLevel } from "@/lib/types";

export const metadata: Metadata = { title: "Courses" };

export default async function CoursesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;
  const list = parseListParams(params);
  const result = await listCourses(supabase, list);
  const filtered = Boolean(list.q || list.status !== "all");

  return (
    <div>
      <PageHeader
        eyebrow="Content"
        title="Courses"
        actions={
          <LinkButton href="/courses/new" variant="primary">
            New course
          </LinkButton>
        }
      />

      <Suspense>
        <ListToolbar q={list.q} status={list.status} total={result.total} noun="course" />
      </Suspense>

      {result.rows.length === 0 ? (
        <EmptyState action={filtered ? undefined : <LinkButton href="/courses/new" size="sm">Create the first course</LinkButton>}>
          {filtered ? "No courses match these filters." : "Courses and their lessons will be listed here."}
        </EmptyState>
      ) : (
        <Table>
          <THead>
            <Tr>
              <Th>Title</Th>
              <Th className="hidden md:table-cell">Level</Th>
              <Th className="hidden sm:table-cell">Lessons</Th>
              <Th>Status</Th>
              <Th className="hidden lg:table-cell">Updated</Th>
              <Th className="w-12">
                <span className="sr-only">Actions</span>
              </Th>
            </Tr>
          </THead>
          <TBody>
            {result.rows.map((course) => (
              <Tr key={course.id}>
                <Td>
                  <Link href={`/courses/${course.id}`} className="font-medium hover:underline">
                    {course.title || "Untitled"}
                  </Link>
                  <span className="mt-0.5 block font-mono text-[0.6875rem] text-ink-soft">
                    /courses/{course.slug}
                    {course.featured ? " · featured" : ""}
                  </span>
                </Td>
                <Td className="hidden text-ink-soft md:table-cell">{LABELS.level[course.level as CourseLevel] ?? course.level}</Td>
                <Td className="hidden font-mono text-xs text-ink-soft sm:table-cell">{course.lessons[0]?.count ?? 0}</Td>
                <Td>
                  <StatusMark status={course.status} publishedAt={course.published_at} />
                </Td>
                <Td className="hidden font-mono text-xs text-ink-soft lg:table-cell">
                  <Time iso={course.updated_at} mode="relative" />
                </Td>
                <Td className="text-right">
                  <RowActions
                    id={course.id}
                    name={course.title || "Untitled"}
                    editHref={`/courses/${course.id}`}
                    publicPath={liveOrNull(course.status, course.published_at, publicPaths.course(course.slug))}
                    onDelete={removeCourse}
                    deleteWarning="Its lessons are deleted with it."
                    noun="course"
                  />
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}

      <Pagination page={result.page} pageCount={result.pageCount} basePath="/courses" searchParams={params} />
    </div>
  );
}
