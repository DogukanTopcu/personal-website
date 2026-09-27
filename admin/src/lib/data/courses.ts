import type { CourseRelation, Insert } from "@/lib/types";
import {
  type DB,
  type ListParams,
  UUID_PATTERN,
  isRangeError,
  likePattern,
  pageRange,
  toListResult,
  unwrap,
} from "./shared";

const LIST_COLUMNS =
  "id, slug, title, level, status, featured, position, published_at, updated_at, lessons(count)" as const;

const EDIT_COLUMNS =
  "id, slug, title, summary, description_md, cover_url, cover_alt, level, topics, featured, position, status, published_at, created_at, updated_at" as const;

const SAVED_COLUMNS = "id, slug, status, published_at, updated_at" as const;

export async function listCourses(db: DB, params: ListParams) {
  let query = db.from("courses").select(LIST_COLUMNS, { count: "exact" }).order("updated_at", { ascending: false });

  if (params.q) query = query.ilike("title", likePattern(params.q));
  if (params.status !== "all") query = query.eq("status", params.status);

  const [from, to] = pageRange(params.page);
  const { data, count, error } = await query.range(from, to);
  if (error && !isRangeError(error)) throw new Error(`Could not load courses: ${error.message}`);
  return toListResult(data, count, params.page);
}

export type CourseListRow = Awaited<ReturnType<typeof listCourses>>["rows"][number];

export async function getCourse(db: DB, id: string) {
  if (!UUID_PATTERN.test(id)) return null;
  const { data, error } = await db.from("courses").select(EDIT_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw new Error(`Could not load the course: ${error.message}`);
  return data;
}

export type CourseRecord = NonNullable<Awaited<ReturnType<typeof getCourse>>>;

/** Every course, for the "links to other courses" picker. */
export async function listCourseOptions(db: DB) {
  const result = await db.from("courses").select("id, title, slug, status").order("title");
  return unwrap(result, "courses");
}

export type CourseOption = Awaited<ReturnType<typeof listCourseOptions>>[number];

export async function listCourseLinks(db: DB, courseId: string) {
  const result = await db
    .from("course_links")
    .select("linked_course_id, relation, position")
    .eq("course_id", courseId)
    .order("position");
  return unwrap(result, "course links").map((link) => ({
    linked_course_id: link.linked_course_id,
    relation: link.relation as CourseRelation,
  }));
}

export type CourseWrite = Pick<
  Insert<"courses">,
  | "title"
  | "slug"
  | "summary"
  | "description_md"
  | "cover_url"
  | "cover_alt"
  | "level"
  | "topics"
  | "featured"
  | "position"
  | "status"
  | "published_at"
>;

export function insertCourse(db: DB, values: CourseWrite) {
  return db.from("courses").insert(values).select(SAVED_COLUMNS).single();
}

export function updateCourse(db: DB, id: string, values: CourseWrite) {
  return db.from("courses").update(values).eq("id", id).select(SAVED_COLUMNS).single();
}

/** Replaces the outgoing links of a course. Order in the list becomes `position`. */
export async function replaceCourseLinks(
  db: DB,
  courseId: string,
  links: Array<{ linked_course_id: string; relation: CourseRelation }>,
) {
  const removed = await db.from("course_links").delete().eq("course_id", courseId);
  if (removed.error) return removed.error;

  const rows = links
    .filter((link) => link.linked_course_id !== courseId)
    .map((link, index) => ({ course_id: courseId, ...link, position: index }));
  if (rows.length === 0) return null;

  const inserted = await db.from("course_links").insert(rows);
  return inserted.error;
}

export async function getCourseRef(db: DB, id: string) {
  const { data } = await db.from("courses").select("id, slug, title, status").eq("id", id).maybeSingle();
  return data;
}

/** Slugs of every course that links to, or is linked from, this one. */
export async function listLinkedCourseSlugs(db: DB, courseId: string): Promise<string[]> {
  const { data } = await db
    .from("course_links")
    .select("course_id, linked_course_id")
    .or(`course_id.eq.${courseId},linked_course_id.eq.${courseId}`);

  const ids = [...new Set((data ?? []).flatMap((link) => [link.course_id, link.linked_course_id]))].filter(
    (id) => id !== courseId,
  );
  if (ids.length === 0) return [];

  const { data: courses } = await db.from("courses").select("slug").in("id", ids);
  return (courses ?? []).map((course) => course.slug);
}

export function deleteCourse(db: DB, id: string) {
  return db.from("courses").delete().eq("id", id);
}
