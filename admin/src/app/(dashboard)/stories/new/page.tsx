import type { Metadata } from "next";
import { StoryForm } from "@/components/forms/story-form";
import { requireAdmin } from "@/lib/auth";
import { STORY_DEFAULTS } from "@/lib/inputs";

export const metadata: Metadata = { title: "New story" };

export default async function NewStoryPage() {
  await requireAdmin();
  return <StoryForm id={null} initial={STORY_DEFAULTS} />;
}
