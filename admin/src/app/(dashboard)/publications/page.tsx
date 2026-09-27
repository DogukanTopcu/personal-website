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
import { removePublication } from "@/lib/actions/publications";
import { requireAdmin } from "@/lib/auth";
import { listPublications } from "@/lib/data/publications";
import { parseListParams, type SearchParams } from "@/lib/data/shared";
import { liveOrNull, publicPaths } from "@/lib/paths";
import { LABELS, type PublicationKind } from "@/lib/types";

export const metadata: Metadata = { title: "Publications" };

export default async function PublicationsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;
  const list = parseListParams(params);
  const result = await listPublications(supabase, list);
  const filtered = Boolean(list.q || list.status !== "all");

  return (
    <div>
      <PageHeader
        eyebrow="Content"
        title="Publications"
        actions={
          <LinkButton href="/publications/new" variant="primary">
            New publication
          </LinkButton>
        }
      />

      <Suspense>
        <ListToolbar q={list.q} status={list.status} total={result.total} noun="publication" />
      </Suspense>

      {result.rows.length === 0 ? (
        <EmptyState action={filtered ? undefined : <LinkButton href="/publications/new" size="sm">Add the first publication</LinkButton>}>
          {filtered ? "No publications match these filters." : "Papers, theses, reports and talks will be listed here."}
        </EmptyState>
      ) : (
        <Table>
          <THead>
            <Tr>
              <Th>Title</Th>
              <Th className="hidden md:table-cell">Kind</Th>
              <Th className="hidden sm:table-cell">Year</Th>
              <Th>Status</Th>
              <Th className="hidden lg:table-cell">Updated</Th>
              <Th className="w-12">
                <span className="sr-only">Actions</span>
              </Th>
            </Tr>
          </THead>
          <TBody>
            {result.rows.map((publication) => (
              <Tr key={publication.id}>
                <Td>
                  <Link href={`/publications/${publication.id}`} className="font-medium hover:underline">
                    {publication.title || "Untitled"}
                  </Link>
                  <span className="mt-0.5 block truncate font-mono text-[0.6875rem] text-ink-soft">
                    {publication.venue || `/research/${publication.slug}`}
                    {publication.featured ? " · featured" : ""}
                  </span>
                </Td>
                <Td className="hidden text-ink-soft md:table-cell">
                  {LABELS.publicationKind[publication.kind as PublicationKind] ?? publication.kind}
                </Td>
                <Td className="hidden font-mono text-xs text-ink-soft sm:table-cell">{publication.year}</Td>
                <Td>
                  <StatusMark status={publication.status} publishedAt={publication.published_at} />
                </Td>
                <Td className="hidden font-mono text-xs text-ink-soft lg:table-cell">
                  <Time iso={publication.updated_at} mode="relative" />
                </Td>
                <Td className="text-right">
                  <RowActions
                    id={publication.id}
                    name={publication.title || "Untitled"}
                    editHref={`/publications/${publication.id}`}
                    publicPath={liveOrNull(publication.status, publication.published_at, publicPaths.publication(publication.slug))}
                    onDelete={removePublication}
                    noun="publication"
                  />
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}

      <Pagination page={result.page} pageCount={result.pageCount} basePath="/publications" searchParams={params} />
    </div>
  );
}
