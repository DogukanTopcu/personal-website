import { cache } from "react";
import { readDb } from "@/lib/supabase/server";
import type { Course, CourseLink, Lesson, LessonCard } from "./types";
import { nowIso, reportDataError } from "./util";

const COURSE = "id, slug, title, summary, description_md, cover_url, cover_alt, level, topics, featured, position, status, published_at, created_at, updated_at";
const LESSON_CARD = "id, course_id, slug, title, summary, section_title, position, video_url, reading_minutes, status, published_at, created_at, updated_at";

export type CourseWithLessons = Course & { lessons: LessonCard[] };

export const listCourses = cache(async (opts: { featuredFirst?: boolean; limit?: number } = {}): Promise<CourseWithLessons[]> => {
  const { db, preview } = await readDb();
  if (!db) return [];
  let query = db.from("courses").select(`${COURSE}, lessons(${LESSON_CARD})`);
  query = preview ? query.neq("status", "archived") : query.eq("status", "published").lte("published_at", nowIso());
  if (opts.featuredFirst) query = query.order("featured", { ascending: false });
  query = query.order("position", { ascending: true }).order("published_at", { ascending: false, nullsFirst: true });
  if (opts.limit) query = query.limit(opts.limit);
  const { data, error } = await query;
  reportDataError("courses", error);
  return (data ?? []).map((course) => ({
    ...course,
    lessons: visibleLessons(course.lessons as LessonCard[], preview),
  })) as unknown as CourseWithLessons[];
});

function visibleLessons<T extends { status: string; published_at: string | null; position: number }>(rows: T[] | null, preview: boolean): T[] {
  const now = Date.now();
  return (rows ?? [])
    .filter((l) => (preview ? l.status !== "archived" : l.status === "published" && l.published_at !== null && Date.parse(l.published_at) <= now))
    .sort((a, b) => a.position - b.position);
}

export const getCourse = cache(async (slug: string): Promise<(CourseWithLessons & { links: CourseLink[] }) | null> => {
  const { db, preview } = await readDb();
  if (!db) return null;
  let query = db.from("courses").select(`${COURSE}, lessons(${LESSON_CARD})`).eq("slug", slug);
  if (!preview) query = query.eq("status", "published").lte("published_at", nowIso());
  const { data, error } = await query.maybeSingle();
  reportDataError(`course:${slug}`, error);
  if (!data) return null;

  const { data: linkRows, error: linkError } = await db
    .from("course_links")
    .select("relation, position, course:courses!course_links_linked_course_id_fkey(slug, title, summary, level, status, published_at)")
    .eq("course_id", data.id)
    .order("position", { ascending: true });
  reportDataError(`course_links:${slug}`, linkError);

  const links: CourseLink[] = (linkRows ?? [])
    .filter((row) => row.course && (preview || row.course.status === "published"))
    .map((row) => ({
      relation: row.relation as CourseLink["relation"],
      course: { slug: row.course!.slug, title: row.course!.title, summary: row.course!.summary, level: row.course!.level },
    }));

  return { ...(data as unknown as Course), lessons: visibleLessons(data.lessons as LessonCard[], preview), links };
});

export const getLesson = cache(
  async (courseSlug: string, lessonSlug: string): Promise<{ course: CourseWithLessons; lesson: Lesson; index: number } | null> => {
    const course = await getCourse(courseSlug);
    if (!course) return null;
    const index = course.lessons.findIndex((l) => l.slug === lessonSlug);
    if (index === -1) return null;
    const { db } = await readDb();
    if (!db) return null;
    const { data, error } = await db.from("lessons").select("*").eq("id", course.lessons[index].id).maybeSingle();
    reportDataError(`lesson:${courseSlug}/${lessonSlug}`, error);
    if (!data) return null;
    const { search, ...lesson } = data as typeof data & { search?: unknown };
    void search; // the tsvector column is never sent to the client
    return { course, lesson: lesson as Lesson, index };
  },
);
