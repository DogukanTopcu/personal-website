"use server";

import { dbFailure, fail, invalid, REVALIDATE_WARNING, type ActionResult, type SavedContent } from "@/lib/action-result";
import { ensureAdmin } from "@/lib/auth";
import {
  deleteCourse,
  getCourseRef,
  insertCourse,
  listLinkedCourseSlugs,
  replaceCourseLinks,
  updateCourse,
} from "@/lib/data/courses";
import { deleteLesson, getLessonRef, insertLesson, listLessonSlugs, updateLesson } from "@/lib/data/lessons";
import type { DB } from "@/lib/data/shared";
import { publicPaths } from "@/lib/paths";
import { revalidatePublic } from "@/lib/revalidate";
import { courseSchema, idListSchema, lessonSchema, type CourseInput, type LessonInput } from "@/lib/schemas";

/** The course page, its lessons, the courses linked to it, the list and home. */
async function coursePaths(db: DB, courseId: string, ...slugs: Array<string | null | undefined>) {
  const [lessons, linked] = await Promise.all([listLessonSlugs(db, courseId), listLinkedCourseSlugs(db, courseId)]);
  const known = slugs.filter((slug): slug is string => Boolean(slug));
  return [
    publicPaths.home,
    publicPaths.courses,
    ...known.map((slug) => publicPaths.course(slug)),
    ...known.flatMap((slug) => lessons.map((lesson) => publicPaths.lesson(slug, lesson))),
    ...linked.map((slug) => publicPaths.course(slug)),
  ];
}

export async function saveCourse(id: string | null, input: CourseInput): Promise<ActionResult<SavedContent>> {
  const gate = await ensureAdmin();
  if (!gate.ok) return fail(gate.error);

  const parsed = courseSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const db = gate.supabase;
  const previous = id ? await getCourseRef(db, id) : null;
  if (id && !previous) return fail("This course no longer exists. It may have been deleted in another tab.");

  const { links, ...values } = parsed.data;
  const { data, error } = id ? await updateCourse(db, id, values) : await insertCourse(db, values);
  if (error) return dbFailure(error);
  if (!data) return fail("The course was not saved.");

  const linkError = await replaceCourseLinks(db, data.id, links);
  if (linkError) return fail(`The course was saved, but its links were not: ${linkError.message}`);

  const refreshed = await revalidatePublic(await coursePaths(db, data.id, data.slug, previous?.slug));
  return { ok: true, data, warning: refreshed ? undefined : REVALIDATE_WARNING };
}

export async function removeCourse(id: string): Promise<ActionResult> {
  const gate = await ensureAdmin();
  if (!gate.ok) return fail(gate.error);

  const db = gate.supabase;
  const previous = await getCourseRef(db, id);
  if (!previous) return fail("This course no longer exists.");

  const paths = await coursePaths(db, id, previous.slug);
  const { error } = await deleteCourse(db, id);
  if (error) return dbFailure(error);

  const refreshed = await revalidatePublic(paths);
  return { ok: true, warning: refreshed ? undefined : REVALIDATE_WARNING };
}

/* ---------------------------------------------------------------- lessons -- */

const LESSON_UNIQUE = "Another lesson in this course already uses this slug.";

export async function saveLesson(courseId: string, id: string | null, input: LessonInput): Promise<ActionResult<SavedContent>> {
  const gate = await ensureAdmin();
  if (!gate.ok) return fail(gate.error);

  const parsed = lessonSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const db = gate.supabase;
  const course = await getCourseRef(db, courseId);
  if (!course) return fail("This course no longer exists.");

  if (id) {
    const previous = await getLessonRef(db, id);
    if (!previous || previous.course_id !== courseId) return fail("This lesson no longer exists.");
  }

  const { data, error } = id ? await updateLesson(db, id, parsed.data) : await insertLesson(db, courseId, parsed.data);
  if (error) return dbFailure(error, { uniqueMessage: LESSON_UNIQUE });
  if (!data) return fail("The lesson was not saved.");

  const refreshed = await revalidatePublic(await coursePaths(db, courseId, course.slug));
  return { ok: true, data, warning: refreshed ? undefined : REVALIDATE_WARNING };
}

export async function removeLesson(id: string): Promise<ActionResult> {
  const gate = await ensureAdmin();
  if (!gate.ok) return fail(gate.error);

  const db = gate.supabase;
  const previous = await getLessonRef(db, id);
  if (!previous) return fail("This lesson no longer exists.");
  const course = await getCourseRef(db, previous.course_id);

  const paths = course ? await coursePaths(db, course.id, course.slug) : [];
  const { error } = await deleteLesson(db, id);
  if (error) return dbFailure(error);

  const refreshed = await revalidatePublic(paths);
  return { ok: true, warning: refreshed ? undefined : REVALIDATE_WARNING };
}

export async function reorderLessons(courseId: string, ids: string[]): Promise<ActionResult> {
  const gate = await ensureAdmin();
  if (!gate.ok) return fail(gate.error);

  const parsed = idListSchema.safeParse(ids);
  if (!parsed.success) return fail("The new order could not be read.");

  const db = gate.supabase;
  const course = await getCourseRef(db, courseId);
  if (!course) return fail("This course no longer exists.");

  const results = await Promise.all(
    parsed.data.map((id, position) => db.from("lessons").update({ position }).eq("id", id).eq("course_id", courseId)),
  );
  const failed = results.find((result) => result.error);
  if (failed?.error) return dbFailure(failed.error);

  const refreshed = await revalidatePublic(await coursePaths(db, courseId, course.slug));
  return { ok: true, warning: refreshed ? undefined : REVALIDATE_WARNING };
}
