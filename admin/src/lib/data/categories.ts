import type { CategoryKind, Insert } from "@/lib/types";
import { type DB, unwrap } from "./shared";

const COLUMNS = "id, kind, slug, name, description, cover_url, position, updated_at" as const;

export async function listCategories(db: DB, kind?: CategoryKind) {
  let query = db.from("categories").select(COLUMNS).order("kind").order("position").order("name");
  if (kind) query = query.eq("kind", kind);
  return unwrap(await query, "categories");
}

export type CategoryRow = Awaited<ReturnType<typeof listCategories>>[number];

/** How many entries use each category, shown next to it and in the delete warning. */
export async function countCategoryUsage(db: DB): Promise<Record<string, number>> {
  const [posts, projects] = await Promise.all([
    db.from("posts").select("category_id").not("category_id", "is", null),
    db.from("projects").select("category_id").not("category_id", "is", null),
  ]);

  const usage: Record<string, number> = {};
  for (const row of [...(posts.data ?? []), ...(projects.data ?? [])]) {
    if (row.category_id) usage[row.category_id] = (usage[row.category_id] ?? 0) + 1;
  }
  return usage;
}

export type CategoryWrite = Pick<Insert<"categories">, "kind" | "name" | "slug" | "description" | "cover_url">;

export async function insertCategory(db: DB, values: CategoryWrite) {
  const { data: last } = await db
    .from("categories")
    .select("position")
    .eq("kind", values.kind)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  return db
    .from("categories")
    .insert({ ...values, position: last ? last.position + 1 : 0 })
    .select(COLUMNS)
    .single();
}

/** The kind of a category never changes after it is created. */
export function updateCategory(db: DB, id: string, values: Omit<CategoryWrite, "kind">) {
  return db.from("categories").update(values).eq("id", id).select(COLUMNS).single();
}

export async function getCategoryRef(db: DB, id: string) {
  const { data } = await db.from("categories").select("id, kind, slug, name").eq("id", id).maybeSingle();
  return data;
}

export function deleteCategory(db: DB, id: string) {
  return db.from("categories").delete().eq("id", id);
}
