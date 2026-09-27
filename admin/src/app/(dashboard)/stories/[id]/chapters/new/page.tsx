import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChapterForm } from "@/components/forms/chapter-form";
import { requireAdmin } from "@/lib/auth";
import { listPartTitles } from "@/lib/data/chapters";
import { getStory } from "@/lib/data/stories";
import { CHAPTER_DEFAULTS } from "@/lib/inputs";
import { liveOrNull } from "@/lib/paths";

export const metadata: Metadata = { title: "New chapter" };

export default async function NewChapterPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAdmin();
  const { id } = await params;
  const story = await getStory(supabase, id);
  if (!story) notFound();
  const parts = await listPartTitles(supabase, story.id);

  return (
    <ChapterForm
      story={{ id: story.id, slug: story.slug, title: story.title, live: liveOrNull(story.status, story.published_at, "x") !== null }}
      id={null}
      initial={CHAPTER_DEFAULTS}
      parts={parts}
    />
  );
}
