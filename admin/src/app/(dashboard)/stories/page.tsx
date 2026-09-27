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
import { removeStory } from "@/lib/actions/stories";
import { requireAdmin } from "@/lib/auth";
import { parseListParams, type SearchParams } from "@/lib/data/shared";
import { listStories } from "@/lib/data/stories";
import { liveOrNull, publicPaths } from "@/lib/paths";
import { LABELS, type StoryFormat } from "@/lib/types";

export const metadata: Metadata = { title: "Stories" };

export default async function StoriesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;
  const list = parseListParams(params);
  const result = await listStories(supabase, list);
  const filtered = Boolean(list.q || list.status !== "all");

  return (
    <div>
      <PageHeader
        eyebrow="Content"
        title="Stories"
        actions={
          <LinkButton href="/stories/new" variant="primary">
            New story
          </LinkButton>
        }
      />

      <Suspense>
        <ListToolbar q={list.q} status={list.status} total={result.total} noun="story" />
      </Suspense>

      {result.rows.length === 0 ? (
        <EmptyState action={filtered ? undefined : <LinkButton href="/stories/new" size="sm">Start the first story</LinkButton>}>
          {filtered ? "No stories match these filters." : "Fiction, in chapters, will be listed here."}
        </EmptyState>
      ) : (
        <Table>
          <THead>
            <Tr>
              <Th>Title</Th>
              <Th className="hidden md:table-cell">Format</Th>
              <Th className="hidden sm:table-cell">Chapters</Th>
              <Th>Status</Th>
              <Th className="hidden lg:table-cell">Updated</Th>
              <Th className="w-12">
                <span className="sr-only">Actions</span>
              </Th>
            </Tr>
          </THead>
          <TBody>
            {result.rows.map((story) => (
              <Tr key={story.id}>
                <Td>
                  <Link href={`/stories/${story.id}`} className="font-medium hover:underline">
                    {story.title || "Untitled"}
                  </Link>
                  <span className="mt-0.5 block font-mono text-[0.6875rem] text-ink-soft">
                    /stories/{story.slug}
                    {story.is_complete ? " · complete" : ""}
                    {story.featured ? " · featured" : ""}
                  </span>
                </Td>
                <Td className="hidden text-ink-soft md:table-cell">{LABELS.format[story.format as StoryFormat] ?? story.format}</Td>
                <Td className="hidden font-mono text-xs text-ink-soft sm:table-cell">{story.chapters[0]?.count ?? 0}</Td>
                <Td>
                  <StatusMark status={story.status} publishedAt={story.published_at} />
                </Td>
                <Td className="hidden font-mono text-xs text-ink-soft lg:table-cell">
                  <Time iso={story.updated_at} mode="relative" />
                </Td>
                <Td className="text-right">
                  <RowActions
                    id={story.id}
                    name={story.title || "Untitled"}
                    editHref={`/stories/${story.id}`}
                    publicPath={liveOrNull(story.status, story.published_at, publicPaths.story(story.slug))}
                    onDelete={removeStory}
                    deleteWarning="Its chapters are deleted with it."
                    noun="story"
                  />
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}

      <Pagination page={result.page} pageCount={result.pageCount} basePath="/stories" searchParams={params} />
    </div>
  );
}
