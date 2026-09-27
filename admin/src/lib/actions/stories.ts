"use server";

import { dbFailure, fail, invalid, REVALIDATE_WARNING, type ActionResult, type SavedContent } from "@/lib/action-result";
import { ensureAdmin } from "@/lib/auth";
import { deleteChapter, getChapterRef, insertChapter, listChapterSlugs, updateChapter } from "@/lib/data/chapters";
import type { DB } from "@/lib/data/shared";
import { deleteStory, getStoryRef, insertStory, updateStory } from "@/lib/data/stories";
import { publicPaths } from "@/lib/paths";
import { revalidatePublic } from "@/lib/revalidate";
import { chapterSchema, idListSchema, storySchema, type ChapterInput, type StoryInput } from "@/lib/schemas";

async function storyPaths(db: DB, storyId: string, ...slugs: Array<string | null | undefined>) {
  const chapters = await listChapterSlugs(db, storyId);
  const known = slugs.filter((slug): slug is string => Boolean(slug));
  return [
    publicPaths.home,
    publicPaths.stories,
    ...known.map((slug) => publicPaths.story(slug)),
    ...known.flatMap((slug) => chapters.map((chapter) => publicPaths.chapter(slug, chapter))),
  ];
}

export async function saveStory(id: string | null, input: StoryInput): Promise<ActionResult<SavedContent>> {
  const gate = await ensureAdmin();
  if (!gate.ok) return fail(gate.error);

  const parsed = storySchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const db = gate.supabase;
  const previous = id ? await getStoryRef(db, id) : null;
  if (id && !previous) return fail("This story no longer exists. It may have been deleted in another tab.");

  const { data, error } = id ? await updateStory(db, id, parsed.data) : await insertStory(db, parsed.data);
  if (error) return dbFailure(error);
  if (!data) return fail("The story was not saved.");

  const refreshed = await revalidatePublic(await storyPaths(db, data.id, data.slug, previous?.slug));
  return { ok: true, data, warning: refreshed ? undefined : REVALIDATE_WARNING };
}

export async function removeStory(id: string): Promise<ActionResult> {
  const gate = await ensureAdmin();
  if (!gate.ok) return fail(gate.error);

  const db = gate.supabase;
  const previous = await getStoryRef(db, id);
  if (!previous) return fail("This story no longer exists.");

  const paths = await storyPaths(db, id, previous.slug);
  const { error } = await deleteStory(db, id);
  if (error) return dbFailure(error);

  const refreshed = await revalidatePublic(paths);
  return { ok: true, warning: refreshed ? undefined : REVALIDATE_WARNING };
}

/* --------------------------------------------------------------- chapters -- */

const CHAPTER_UNIQUE = "Another chapter in this story already uses this slug.";

export async function saveChapter(storyId: string, id: string | null, input: ChapterInput): Promise<ActionResult<SavedContent>> {
  const gate = await ensureAdmin();
  if (!gate.ok) return fail(gate.error);

  const parsed = chapterSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const db = gate.supabase;
  const story = await getStoryRef(db, storyId);
  if (!story) return fail("This story no longer exists.");

  if (id) {
    const previous = await getChapterRef(db, id);
    if (!previous || previous.story_id !== storyId) return fail("This chapter no longer exists.");
  }

  const { data, error } = id ? await updateChapter(db, id, parsed.data) : await insertChapter(db, storyId, parsed.data);
  if (error) return dbFailure(error, { uniqueMessage: CHAPTER_UNIQUE });
  if (!data) return fail("The chapter was not saved.");

  const refreshed = await revalidatePublic(await storyPaths(db, storyId, story.slug));
  return { ok: true, data, warning: refreshed ? undefined : REVALIDATE_WARNING };
}

export async function removeChapter(id: string): Promise<ActionResult> {
  const gate = await ensureAdmin();
  if (!gate.ok) return fail(gate.error);

  const db = gate.supabase;
  const previous = await getChapterRef(db, id);
  if (!previous) return fail("This chapter no longer exists.");
  const story = await getStoryRef(db, previous.story_id);

  const paths = story ? await storyPaths(db, story.id, story.slug) : [];
  const { error } = await deleteChapter(db, id);
  if (error) return dbFailure(error);

  const refreshed = await revalidatePublic(paths);
  return { ok: true, warning: refreshed ? undefined : REVALIDATE_WARNING };
}

export async function reorderChapters(storyId: string, ids: string[]): Promise<ActionResult> {
  const gate = await ensureAdmin();
  if (!gate.ok) return fail(gate.error);

  const parsed = idListSchema.safeParse(ids);
  if (!parsed.success) return fail("The new order could not be read.");

  const db = gate.supabase;
  const story = await getStoryRef(db, storyId);
  if (!story) return fail("This story no longer exists.");

  const results = await Promise.all(
    parsed.data.map((id, position) => db.from("chapters").update({ position }).eq("id", id).eq("story_id", storyId)),
  );
  const failed = results.find((result) => result.error);
  if (failed?.error) return dbFailure(failed.error);

  const refreshed = await revalidatePublic(await storyPaths(db, storyId, story.slug));
  return { ok: true, warning: refreshed ? undefined : REVALIDATE_WARNING };
}
