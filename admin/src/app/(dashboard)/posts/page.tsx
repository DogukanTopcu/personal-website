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
import { removePost } from "@/lib/actions/posts";
import { requireAdmin } from "@/lib/auth";
import { listCategories } from "@/lib/data/categories";
import { listPosts } from "@/lib/data/posts";
import { parseListParams, type SearchParams } from "@/lib/data/shared";
import { liveOrNull, publicPaths } from "@/lib/paths";

export const metadata: Metadata = { title: "Posts" };

export default async function PostsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;
  const list = parseListParams(params);
  const [result, categories] = await Promise.all([listPosts(supabase, list), listCategories(supabase, "post")]);
  const filtered = Boolean(list.q || list.status !== "all" || list.category);

  return (
    <div>
      <PageHeader
        eyebrow="Content"
        title="Posts"
        actions={
          <LinkButton href="/posts/new" variant="primary">
            New post
          </LinkButton>
        }
      />

      <Suspense>
        <ListToolbar q={list.q} status={list.status} category={list.category} categories={categories} total={result.total} noun="post" />
      </Suspense>

      {result.rows.length === 0 ? (
        <EmptyState action={filtered ? undefined : <LinkButton href="/posts/new" size="sm">Write the first post</LinkButton>}>
          {filtered ? "No posts match these filters." : "Blog posts, reviews and essays will be listed here."}
        </EmptyState>
      ) : (
        <Table>
          <THead>
            <Tr>
              <Th>Title</Th>
              <Th className="hidden md:table-cell">Category</Th>
              <Th>Status</Th>
              <Th className="hidden sm:table-cell">Published</Th>
              <Th className="hidden lg:table-cell">Updated</Th>
              <Th className="w-12">
                <span className="sr-only">Actions</span>
              </Th>
            </Tr>
          </THead>
          <TBody>
            {result.rows.map((post) => (
              <Tr key={post.id}>
                <Td>
                  <Link href={`/posts/${post.id}`} className="font-medium hover:underline">
                    {post.title || "Untitled"}
                  </Link>
                  <span className="mt-0.5 block font-mono text-[0.6875rem] text-ink-soft">
                    /blog/{post.slug}
                    {post.featured ? " · pinned" : ""}
                  </span>
                </Td>
                <Td className="hidden text-ink-soft md:table-cell">{post.category?.name ?? "-"}</Td>
                <Td>
                  <StatusMark status={post.status} publishedAt={post.published_at} />
                </Td>
                <Td className="hidden font-mono text-xs text-ink-soft sm:table-cell">
                  <Time iso={post.published_at} />
                </Td>
                <Td className="hidden font-mono text-xs text-ink-soft lg:table-cell">
                  <Time iso={post.updated_at} mode="relative" />
                </Td>
                <Td className="text-right">
                  <RowActions
                    id={post.id}
                    name={post.title || "Untitled"}
                    editHref={`/posts/${post.id}`}
                    publicPath={liveOrNull(post.status, post.published_at, publicPaths.post(post.slug))}
                    onDelete={removePost}
                    noun="post"
                  />
                </Td>
              </Tr>
            ))}
          </TBody>
        </Table>
      )}

      <Pagination page={result.page} pageCount={result.pageCount} basePath="/posts" searchParams={params} />
    </div>
  );
}
