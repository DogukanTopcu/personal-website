import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LessonsPanel } from "@/components/forms/child-panels";
import { CourseForm } from "@/components/forms/course-form";
import { requireAdmin } from "@/lib/auth";
import { getCourse, listCourseLinks, listCourseOptions } from "@/lib/data/courses";
import { listLessons } from "@/lib/data/lessons";
import { toCourseInput } from "@/lib/inputs";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { supabase } = await requireAdmin();
  const course = await getCourse(supabase, (await params).id);
  return { title: course ? course.title || "Untitled course" : "Course" };
}

export default async function EditCoursePage({ params }: { params: Params }) {
  const { supabase } = await requireAdmin();
  const { id } = await params;
  const course = await getCourse(supabase, id);
  if (!course) notFound();

  const [links, courses, lessons] = await Promise.all([
    listCourseLinks(supabase, course.id),
    listCourseOptions(supabase),
    listLessons(supabase, course.id),
  ]);

  return (
    <CourseForm
      key={course.id}
      id={course.id}
      initial={toCourseInput(course, links)}
      courses={courses}
      lessons={<LessonsPanel courseId={course.id} lessons={lessons} />}
    />
  );
}
