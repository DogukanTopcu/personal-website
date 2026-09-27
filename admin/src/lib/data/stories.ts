import type { Insert } from "@/lib/types";
import {
  type DB,
  type ListParams,
  UUID_PATTERN,
  isRangeError,
  likePattern,
  pageRange,
  toListResult,
} from "./shared";

const LIST_COLUMNS =
  "id, slug, title, format, is_complete, status, featured, position, published_at, updated_at, chapters(count)" as const;

const EDIT_COLUMNS =
  "id, slug, title, synopsis, cover_url, cover_alt, format, genre, is_complete, featured, position, status, published_at, created_at, updated_at" as const;

const SAVED_COLUMNS = "id, slug, status, published_at, updated_at" as const;

export async function listStories(db: DB, params: ListParams) {
  let query = db.from("stories").select(LIST_COLUMNS, { count: "exact" }).order("updated_at", { ascending: false });

  if (params.q) query = query.ilike("title", likePattern(params.q));
  if (params.status !== "all") query = query.eq("status", params.status);

  const [from, to] = pageRange(params.page);
  const { data, count, error } = await query.range(from, to);
  if (error && !isRangeError(error)) throw new Error(`Could not load stories: ${error.message}`);
  return toListResult(data, count, params.page);
}

export type StoryListRow = Awaited<ReturnType<typeof listStories>>["rows"][number];

export async function getStory(db: DB, id: string) {
  if (!UUID_PATTERN.test(id)) return null;
  const { data, error } = await db.from("stories").select(EDIT_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw new Error(`Could not load the story: ${error.message}`);
  return data;
}

export type StoryRecord = NonNullable<Awaited<ReturnType<typeof getStory>>>;

export type StoryWrite = Pick<
  Insert<"stories">,
  | "title"
  | "slug"
  | "synopsis"
  | "cover_url"
  | "cover_alt"
  | "format"
  | "genre"
  | "is_complete"
  | "featured"
  | "position"
  | "status"
  | "published_at"
>;

export function insertStory(db: DB, values: StoryWrite) {
  return db.from("stories").insert(values).select(SAVED_COLUMNS).single();
}

export function updateStory(db: DB, id: string, values: StoryWrite) {
  return db.from("stories").update(values).eq("id", id).select(SAVED_COLUMNS).single();
}

export async function getStoryRef(db: DB, id: string) {
  const { data } = await db.from("stories").select("id, slug, title, status").eq("id", id).maybeSingle();
  return data;
}

export function deleteStory(db: DB, id: string) {
  return db.from("stories").delete().eq("id", id);
}
