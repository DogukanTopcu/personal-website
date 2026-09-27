import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LessonForm } from "@/components/forms/lesson-form";
import { requireAdmin } from "@/lib/auth";
import { getCourse } from "@/lib/data/courses";
import { getLesson, listSectionTitles } from "@/lib/data/lessons";
import { toLessonInput } from "@/lib/inputs";
import { liveOrNull } from "@/lib/paths";

type Params = Promise<{ id: string; lessonId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { supabase } = await requireAdmin();
  const { id, lessonId } = await params;
  const lesson = await getLesson(supabase, id, lessonId);
  return { title: lesson ? lesson.title || "Untitled lesson" : "Lesson" };
}

export default async function EditLessonPage({ params }: { params: Params }) {
  const { supabase } = await requireAdmin();
  const { id, lessonId } = await params;
  const [course, lesson] = await Promise.all([getCourse(supabase, id), getLesson(supabase, id, lessonId)]);
  if (!course || !lesson) notFound();
  const sections = await listSectionTitles(supabase, course.id);

  return (
    <LessonForm
      key={lesson.id}
      course={{ id: course.id, slug: course.slug, title: course.title, live: liveOrNull(course.status, course.published_at, "x") !== null }}
      id={lesson.id}
      initial={toLessonInput(lesson)}
      sections={sections}
    />
  );
}
