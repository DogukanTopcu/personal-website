import type { Insert } from "@/lib/types";
import {
  type DB,
  type ListParams,
  UUID_PATTERN,
  isRangeError,
  likePattern,
  pageRange,
  toListResult,
  unwrap,
} from "./shared";

const LIST_COLUMNS =
  "id, slug, title, status, featured, published_at, updated_at, category:categories(id, name, slug)" as const;

const EDIT_COLUMNS =
  "id, slug, title, excerpt, cover_url, cover_alt, category_id, tags, content_md, reading_minutes, review, featured, status, published_at, created_at, updated_at" as const;

export const SAVED_COLUMNS = "id, slug, status, published_at, updated_at" as const;

export async function listPosts(db: DB, params: ListParams) {
  let query = db.from("posts").select(LIST_COLUMNS, { count: "exact" }).order("updated_at", { ascending: false });

  if (params.q) query = query.ilike("title", likePattern(params.q));
  if (params.status !== "all") query = query.eq("status", params.status);
  if (params.category === "none") query = query.is("category_id", null);
  else if (UUID_PATTERN.test(params.category)) query = query.eq("category_id", params.category);

  const [from, to] = pageRange(params.page);
  const { data, count, error } = await query.range(from, to);
  if (error && !isRangeError(error)) throw new Error(`Could not load posts: ${error.message}`);
  return toListResult(data, count, params.page);
}

export type PostListRow = Awaited<ReturnType<typeof listPosts>>["rows"][number];

export async function getPost(db: DB, id: string) {
  if (!UUID_PATTERN.test(id)) return null;
  const { data, error } = await db.from("posts").select(EDIT_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw new Error(`Could not load the post: ${error.message}`);
  return data;
}

export type PostRecord = NonNullable<Awaited<ReturnType<typeof getPost>>>;

export type PostWrite = Pick<
  Insert<"posts">,
  | "title"
  | "slug"
  | "excerpt"
  | "cover_url"
  | "cover_alt"
  | "category_id"
  | "tags"
  | "content_md"
  | "review"
  | "featured"
  | "status"
  | "published_at"
>;

export function insertPost(db: DB, values: PostWrite) {
  return db.from("posts").insert(values).select(SAVED_COLUMNS).single();
}

export function updatePost(db: DB, id: string, values: PostWrite) {
  return db.from("posts").update(values).eq("id", id).select(SAVED_COLUMNS).single();
}

/** Slug and status as stored, to know which public pages a change touches. */
export async function getPostRef(db: DB, id: string) {
  const { data } = await db.from("posts").select("id, slug, title, status").eq("id", id).maybeSingle();
  return data;
}

export function deletePost(db: DB, id: string) {
  return db.from("posts").delete().eq("id", id);
}

/** Published post paths in a category, refreshed when the category itself changes. */
export async function listPostSlugsByCategory(db: DB, categoryId: string): Promise<string[]> {
  const result = await db.from("posts").select("slug").eq("category_id", categoryId).eq("status", "published").limit(500);
  return unwrap(result, "posts in the category").map((row) => row.slug);
}
