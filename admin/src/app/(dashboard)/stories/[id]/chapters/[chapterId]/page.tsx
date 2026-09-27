import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChapterForm } from "@/components/forms/chapter-form";
import { requireAdmin } from "@/lib/auth";
import { getChapter, listPartTitles } from "@/lib/data/chapters";
import { getStory } from "@/lib/data/stories";
import { toChapterInput } from "@/lib/inputs";
import { liveOrNull } from "@/lib/paths";

type Params = Promise<{ id: string; chapterId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { supabase } = await requireAdmin();
  const { id, chapterId } = await params;
  const chapter = await getChapter(supabase, id, chapterId);
  return { title: chapter ? chapter.title || "Untitled chapter" : "Chapter" };
}

export default async function EditChapterPage({ params }: { params: Params }) {
  const { supabase } = await requireAdmin();
  const { id, chapterId } = await params;
  const [story, chapter] = await Promise.all([getStory(supabase, id), getChapter(supabase, id, chapterId)]);
  if (!story || !chapter) notFound();
  const parts = await listPartTitles(supabase, story.id);

  return (
    <ChapterForm
      key={chapter.id}
      story={{ id: story.id, slug: story.slug, title: story.title, live: liveOrNull(story.status, story.published_at, "x") !== null }}
      id={chapter.id}
      initial={toChapterInput(chapter)}
      parts={parts}
    />
  );
}
