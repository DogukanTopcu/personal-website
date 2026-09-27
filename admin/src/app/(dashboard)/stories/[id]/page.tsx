import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChaptersPanel } from "@/components/forms/child-panels";
import { StoryForm } from "@/components/forms/story-form";
import { requireAdmin } from "@/lib/auth";
import { listChapters } from "@/lib/data/chapters";
import { getStory } from "@/lib/data/stories";
import { toStoryInput } from "@/lib/inputs";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { supabase } = await requireAdmin();
  const story = await getStory(supabase, (await params).id);
  return { title: story ? story.title || "Untitled story" : "Story" };
}

export default async function EditStoryPage({ params }: { params: Params }) {
  const { supabase } = await requireAdmin();
  const { id } = await params;
  const story = await getStory(supabase, id);
  if (!story) notFound();
  const chapters = await listChapters(supabase, story.id);

  return (
    <StoryForm
      key={story.id}
      id={story.id}
      initial={toStoryInput(story)}
      chapters={<ChaptersPanel storyId={story.id} chapters={chapters} />}
    />
  );
}
