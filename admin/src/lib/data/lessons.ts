import type { Insert } from "@/lib/types";
import { type DB, UUID_PATTERN, unwrap } from "./shared";

const LIST_COLUMNS = "id, slug, title, section_title, position, status, published_at, reading_minutes, updated_at" as const;

const EDIT_COLUMNS =
  "id, course_id, slug, title, summary, section_title, position, video_url, content_md, reading_minutes, status, published_at, created_at, updated_at" as const;

const SAVED_COLUMNS = "id, slug, status, published_at, updated_at" as const;

export async function listLessons(db: DB, courseId: string) {
  const result = await db.from("lessons").select(LIST_COLUMNS).eq("course_id", courseId).order("position").order("created_at");
  return unwrap(result, "lessons");
}

export type LessonListRow = Awaited<ReturnType<typeof listLessons>>[number];

export async function getLesson(db: DB, courseId: string, id: string) {
  if (!UUID_PATTERN.test(id) || !UUID_PATTERN.test(courseId)) return null;
  const { data, error } = await db
    .from("lessons")
    .select(EDIT_COLUMNS)
    .eq("id", id)
    .eq("course_id", courseId)
    .maybeSingle();
  if (error) throw new Error(`Could not load the lesson: ${error.message}`);
  return data;
}

export type LessonRecord = NonNullable<Awaited<ReturnType<typeof getLesson>>>;

/** Section titles already used in the course, offered as suggestions. */
export async function listSectionTitles(db: DB, courseId: string): Promise<string[]> {
  const result = await db.from("lessons").select("section_title").eq("course_id", courseId).order("position");
  return [...new Set(unwrap(result, "sections").map((row) => row.section_title).filter(Boolean))];
}

export type LessonWrite = Pick<
  Insert<"lessons">,
  "title" | "slug" | "summary" | "section_title" | "video_url" | "content_md" | "status" | "published_at"
>;

async function nextPosition(db: DB, courseId: string): Promise<number> {
  const { data } = await db
    .from("lessons")
    .select("position")
    .eq("course_id", courseId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? data.position + 1 : 0;
}

export async function insertLesson(db: DB, courseId: string, values: LessonWrite) {
  const position = await nextPosition(db, courseId);
  return db
    .from("lessons")
    .insert({ ...values, course_id: courseId, position })
    .select(SAVED_COLUMNS)
    .single();
}

export function updateLesson(db: DB, id: string, values: LessonWrite) {
  return db.from("lessons").update(values).eq("id", id).select(SAVED_COLUMNS).single();
}

export async function getLessonRef(db: DB, id: string) {
  const { data } = await db.from("lessons").select("id, slug, title, status, course_id").eq("id", id).maybeSingle();
  return data;
}

export async function listLessonSlugs(db: DB, courseId: string): Promise<string[]> {
  const { data } = await db.from("lessons").select("slug").eq("course_id", courseId);
  return (data ?? []).map((row) => row.slug);
}

export function deleteLesson(db: DB, id: string) {
  return db.from("lessons").delete().eq("id", id);
}
