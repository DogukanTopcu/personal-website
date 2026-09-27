import type { Metadata } from "next";
import { CourseForm } from "@/components/forms/course-form";
import { requireAdmin } from "@/lib/auth";
import { listCourseOptions } from "@/lib/data/courses";
import { COURSE_DEFAULTS } from "@/lib/inputs";

export const metadata: Metadata = { title: "New course" };

export default async function NewCoursePage() {
  const { supabase } = await requireAdmin();
  const courses = await listCourseOptions(supabase);
  return <CourseForm id={null} initial={COURSE_DEFAULTS} courses={courses} />;
}
