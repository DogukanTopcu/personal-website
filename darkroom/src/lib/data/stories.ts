import { cache } from "react";
import { readDb } from "@/lib/supabase/server";
import type { Chapter, ChapterCard, Story } from "./types";
import { nowIso, reportDataError } from "./util";

const STORY = "id, slug, title, synopsis, cover_url, cover_alt, format, genre, is_complete, featured, position, status, published_at, created_at, updated_at";
const CHAPTER_CARD = "id, story_id, slug, title, part_title, position, reading_minutes, status, published_at, created_at, updated_at";

export type StoryWithChapters = Story & { chapters: ChapterCard[] };

function visibleChapters(rows: ChapterCard[] | null, preview: boolean): ChapterCard[] {
  const now = Date.now();
  return (rows ?? [])
    .filter((c) => (preview ? c.status !== "archived" : c.status === "published" && c.published_at !== null && Date.parse(c.published_at) <= now))
    .sort((a, b) => a.position - b.position);
}

export const listStories = cache(async (opts: { limit?: number } = {}): Promise<StoryWithChapters[]> => {
  const { db, preview } = await readDb();
  if (!db) return [];
  let query = db.from("stories").select(`${STORY}, chapters(${CHAPTER_CARD})`);
  query = preview ? query.neq("status", "archived") : query.eq("status", "published").lte("published_at", nowIso());
  query = query.order("position", { ascending: true }).order("published_at", { ascending: false, nullsFirst: true });
  if (opts.limit) query = query.limit(opts.limit);
  const { data, error } = await query;
  reportDataError("stories", error);
  return (data ?? []).map((s) => ({ ...s, chapters: visibleChapters(s.chapters as ChapterCard[], preview) })) as unknown as StoryWithChapters[];
});

export const getStory = cache(async (slug: string): Promise<StoryWithChapters | null> => {
  const { db, preview } = await readDb();
  if (!db) return null;
  let query = db.from("stories").select(`${STORY}, chapters(${CHAPTER_CARD})`).eq("slug", slug);
  if (!preview) query = query.eq("status", "published").lte("published_at", nowIso());
  const { data, error } = await query.maybeSingle();
  reportDataError(`story:${slug}`, error);
  if (!data) return null;
  return { ...(data as unknown as Story), chapters: visibleChapters(data.chapters as ChapterCard[], preview) };
});

export const getChapter = cache(
  async (storySlug: string, chapterSlug: string): Promise<{ story: StoryWithChapters; chapter: Chapter; index: number } | null> => {
    const story = await getStory(storySlug);
    if (!story) return null;
    const index = story.chapters.findIndex((c) => c.slug === chapterSlug);
    if (index === -1) return null;
    const { db } = await readDb();
    if (!db) return null;
    const { data, error } = await db.from("chapters").select("*").eq("id", story.chapters[index].id).maybeSingle();
    reportDataError(`chapter:${storySlug}/${chapterSlug}`, error);
    if (!data) return null;
    return { story, chapter: data, index };
  },
);
