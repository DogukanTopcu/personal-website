import { cache } from "react";
import { readDb } from "@/lib/supabase/server";
import type { Post, PostCard, Review } from "./types";
import { asRecord, nowIso, reportDataError } from "./util";

const CARD =
  "id, slug, title, excerpt, cover_url, cover_alt, category_id, tags, reading_minutes, review, featured, status, published_at, created_at, updated_at, category:categories(*)";

function toReview(value: unknown): Review | null {
  const r = asRecord(value as never);
  if (Object.keys(r).length === 0) return null;
  return {
    subject: typeof r.subject === "string" ? r.subject : undefined,
    creator: typeof r.creator === "string" ? r.creator : undefined,
    year: typeof r.year === "number" ? r.year : undefined,
    rating: typeof r.rating === "number" ? r.rating : undefined,
    verdict: typeof r.verdict === "string" ? r.verdict : undefined,
  };
}

export const listPosts = cache(
  async (opts: { category?: string; tag?: string; limit?: number; featuredFirst?: boolean } = {}): Promise<PostCard[]> => {
    const { db, preview } = await readDb();
    if (!db) return [];
    let query = db.from("posts").select(CARD);
    query = preview ? query.neq("status", "archived") : query.eq("status", "published").lte("published_at", nowIso());
    if (opts.tag) query = query.contains("tags", [opts.tag]);
    if (opts.featuredFirst) query = query.order("featured", { ascending: false });
    query = query.order("published_at", { ascending: false, nullsFirst: true });
    if (opts.limit) query = query.limit(opts.limit * (opts.category ? 6 : 1));
    const { data, error } = await query;
    reportDataError("posts", error);
    let rows = (data ?? []).map((row) => ({ ...row, review: toReview(row.review) })) as unknown as PostCard[];
    if (opts.category) rows = rows.filter((p) => p.category?.slug === opts.category);
    return opts.limit ? rows.slice(0, opts.limit) : rows;
  },
);

export const getPost = cache(async (slug: string): Promise<Post | null> => {
  const { db, preview } = await readDb();
  if (!db) return null;
  let query = db.from("posts").select("*, category:categories(*)").eq("slug", slug);
  if (!preview) query = query.eq("status", "published").lte("published_at", nowIso());
  const { data, error } = await query.maybeSingle();
  reportDataError(`post:${slug}`, error);
  if (!data) return null;
  const { search, ...rest } = data as typeof data & { search?: unknown };
  void search; // the tsvector column is never sent to the client
  return { ...rest, review: toReview(data.review) } as unknown as Post;
});

export async function adjacentPosts(slug: string): Promise<{ newer: PostCard | null; older: PostCard | null }> {
  const all = await listPosts();
  const index = all.findIndex((p) => p.slug === slug);
  if (index === -1) return { newer: null, older: null };
  return { newer: all[index - 1] ?? null, older: all[index + 1] ?? null };
}
