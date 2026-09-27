import type { Insert } from "@/lib/types";
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
  "id, slug, title, status, featured, position, published_at, updated_at, category:categories(id, name, slug)" as const;

const EDIT_COLUMNS =
  "id, slug, title, summary, cover_url, cover_alt, category_id, role, tech, started_on, ended_on, is_ongoing, repo_url, live_url, gallery, content_md, reading_minutes, featured, position, status, published_at, created_at, updated_at" as const;

const SAVED_COLUMNS = "id, slug, status, published_at, updated_at" as const;

export async function listProjects(db: DB, params: ListParams) {
  let query = db.from("projects").select(LIST_COLUMNS, { count: "exact" }).order("updated_at", { ascending: false });

  if (params.q) query = query.ilike("title", likePattern(params.q));
  if (params.status !== "all") query = query.eq("status", params.status);
  if (params.category === "none") query = query.is("category_id", null);
  else if (UUID_PATTERN.test(params.category)) query = query.eq("category_id", params.category);

  const [from, to] = pageRange(params.page);
  const { data, count, error } = await query.range(from, to);
  if (error && !isRangeError(error)) throw new Error(`Could not load projects: ${error.message}`);
  return toListResult(data, count, params.page);
}

export type ProjectListRow = Awaited<ReturnType<typeof listProjects>>["rows"][number];

export async function getProject(db: DB, id: string) {
  if (!UUID_PATTERN.test(id)) return null;
  const { data, error } = await db.from("projects").select(EDIT_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw new Error(`Could not load the project: ${error.message}`);
  return data;
}

export type ProjectRecord = NonNullable<Awaited<ReturnType<typeof getProject>>>;

export type ProjectWrite = Pick<
  Insert<"projects">,
  | "title"
  | "slug"
  | "summary"
  | "cover_url"
  | "cover_alt"
  | "category_id"
  | "role"
  | "tech"
  | "started_on"
  | "ended_on"
  | "is_ongoing"
  | "repo_url"
  | "live_url"
  | "gallery"
  | "content_md"
  | "featured"
  | "position"
  | "status"
  | "published_at"
>;

export function insertProject(db: DB, values: ProjectWrite) {
  return db.from("projects").insert(values).select(SAVED_COLUMNS).single();
}

export function updateProject(db: DB, id: string, values: ProjectWrite) {
  return db.from("projects").update(values).eq("id", id).select(SAVED_COLUMNS).single();
}

export async function getProjectRef(db: DB, id: string) {
  const { data } = await db.from("projects").select("id, slug, title, status").eq("id", id).maybeSingle();
  return data;
}

export function deleteProject(db: DB, id: string) {
  return db.from("projects").delete().eq("id", id);
}

export async function listProjectSlugsByCategory(db: DB, categoryId: string): Promise<string[]> {
  const result = await db
    .from("projects")
    .select("slug")
    .eq("category_id", categoryId)
    .eq("status", "published")
    .limit(500);
  return unwrap(result, "projects in the category").map((row) => row.slug);
}
