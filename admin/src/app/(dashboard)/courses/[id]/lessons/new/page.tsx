import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LessonForm } from "@/components/forms/lesson-form";
import { requireAdmin } from "@/lib/auth";
import { getCourse } from "@/lib/data/courses";
import { listSectionTitles } from "@/lib/data/lessons";
import { LESSON_DEFAULTS } from "@/lib/inputs";
import { liveOrNull } from "@/lib/paths";

export const metadata: Metadata = { title: "New lesson" };

export default async function NewLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { supabase } = await requireAdmin();
  const { id } = await params;
  const course = await getCourse(supabase, id);
  if (!course) notFound();
  const sections = await listSectionTitles(supabase, course.id);

  return (
    <LessonForm
      course={{ id: course.id, slug: course.slug, title: course.title, live: liveOrNull(course.status, course.published_at, "x") !== null }}
      id={null}
      initial={LESSON_DEFAULTS}
      sections={sections}
    />
  );
}
