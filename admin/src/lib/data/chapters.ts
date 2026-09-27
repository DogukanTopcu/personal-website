import type { Insert } from "@/lib/types";
import { type DB, UUID_PATTERN, unwrap } from "./shared";

const LIST_COLUMNS = "id, slug, title, part_title, position, status, published_at, reading_minutes, updated_at" as const;

const EDIT_COLUMNS =
  "id, story_id, slug, title, part_title, position, content_md, reading_minutes, status, published_at, created_at, updated_at" as const;

const SAVED_COLUMNS = "id, slug, status, published_at, updated_at" as const;

export async function listChapters(db: DB, storyId: string) {
  const result = await db.from("chapters").select(LIST_COLUMNS).eq("story_id", storyId).order("position").order("created_at");
  return unwrap(result, "chapters");
}

export type ChapterListRow = Awaited<ReturnType<typeof listChapters>>[number];

export async function getChapter(db: DB, storyId: string, id: string) {
  if (!UUID_PATTERN.test(id) || !UUID_PATTERN.test(storyId)) return null;
  const { data, error } = await db
    .from("chapters")
    .select(EDIT_COLUMNS)
    .eq("id", id)
    .eq("story_id", storyId)
    .maybeSingle();
  if (error) throw new Error(`Could not load the chapter: ${error.message}`);
  return data;
}

export type ChapterRecord = NonNullable<Awaited<ReturnType<typeof getChapter>>>;

/** Part titles already used in the story, offered as suggestions. */
export async function listPartTitles(db: DB, storyId: string): Promise<string[]> {
  const result = await db.from("chapters").select("part_title").eq("story_id", storyId).order("position");
  return [...new Set(unwrap(result, "parts").map((row) => row.part_title).filter(Boolean))];
}

export type ChapterWrite = Pick<
  Insert<"chapters">,
  "title" | "slug" | "part_title" | "content_md" | "status" | "published_at"
>;

async function nextPosition(db: DB, storyId: string): Promise<number> {
  const { data } = await db
    .from("chapters")
    .select("position")
    .eq("story_id", storyId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? data.position + 1 : 0;
}

export async function insertChapter(db: DB, storyId: string, values: ChapterWrite) {
  const position = await nextPosition(db, storyId);
  return db
    .from("chapters")
    .insert({ ...values, story_id: storyId, position })
    .select(SAVED_COLUMNS)
    .single();
}

export function updateChapter(db: DB, id: string, values: ChapterWrite) {
  return db.from("chapters").update(values).eq("id", id).select(SAVED_COLUMNS).single();
}

export async function getChapterRef(db: DB, id: string) {
  const { data } = await db.from("chapters").select("id, slug, title, status, story_id").eq("id", id).maybeSingle();
  return data;
}

export async function listChapterSlugs(db: DB, storyId: string): Promise<string[]> {
  const { data } = await db.from("chapters").select("slug").eq("story_id", storyId);
  return (data ?? []).map((row) => row.slug);
}

export function deleteChapter(db: DB, id: string) {
  return db.from("chapters").delete().eq("id", id);
}
