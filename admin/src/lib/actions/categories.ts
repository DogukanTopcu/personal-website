"use server";

import { dbFailure, fail, invalid, REVALIDATE_WARNING, type ActionResult } from "@/lib/action-result";
import { ensureAdmin } from "@/lib/auth";
import { deleteCategory, getCategoryRef, insertCategory, updateCategory, type CategoryRow } from "@/lib/data/categories";
import { listPostSlugsByCategory } from "@/lib/data/posts";
import { listProjectSlugsByCategory } from "@/lib/data/projects";
import type { DB } from "@/lib/data/shared";
import { publicPaths } from "@/lib/paths";
import { revalidatePublic } from "@/lib/revalidate";
import { categorySchema, idListSchema, type CategoryInput } from "@/lib/schemas";

const CATEGORY_UNIQUE = "Another category of this kind already uses this slug.";

/** Lists plus every published entry that shows the category's name or fallback cover. */
async function pathsFor(db: DB, kind: string, categoryId: string | null) {
  const base = [publicPaths.home, kind === "post" ? publicPaths.blog : publicPaths.projects];
  if (!categoryId) return base;
  if (kind === "post") return [...base, ...(await listPostSlugsByCategory(db, categoryId)).map(publicPaths.post)];
  return [...base, ...(await listProjectSlugsByCategory(db, categoryId)).map(publicPaths.project)];
}

export async function saveCategory(id: string | null, input: CategoryInput): Promise<ActionResult<CategoryRow>> {
  const gate = await ensureAdmin();
  if (!gate.ok) return fail(gate.error);

  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const db = gate.supabase;
  const previous = id ? await getCategoryRef(db, id) : null;
  if (id && !previous) return fail("This category no longer exists.");

  const { kind, ...rest } = parsed.data;
  const { data, error } = id ? await updateCategory(db, id, rest) : await insertCategory(db, { kind, ...rest });
  if (error) return dbFailure(error, { uniqueMessage: CATEGORY_UNIQUE });
  if (!data) return fail("The category was not saved.");

  const refreshed = await revalidatePublic(await pathsFor(db, data.kind, data.id));
  return { ok: true, data, warning: refreshed ? undefined : REVALIDATE_WARNING };
}

export async function removeCategory(id: string): Promise<ActionResult> {
  const gate = await ensureAdmin();
  if (!gate.ok) return fail(gate.error);

  const db = gate.supabase;
  const previous = await getCategoryRef(db, id);
  if (!previous) return fail("This category no longer exists.");

  const paths = await pathsFor(db, previous.kind, id);
  const { error } = await deleteCategory(db, id);
  if (error) return dbFailure(error);

  const refreshed = await revalidatePublic(paths);
  return { ok: true, warning: refreshed ? undefined : REVALIDATE_WARNING };
}

export async function reorderCategories(ids: string[]): Promise<ActionResult> {
  const gate = await ensureAdmin();
  if (!gate.ok) return fail(gate.error);

  const parsed = idListSchema.safeParse(ids);
  if (!parsed.success) return fail("The new order could not be read.");

  const db = gate.supabase;
  const results = await Promise.all(parsed.data.map((id, position) => db.from("categories").update({ position }).eq("id", id)));
  const failed = results.find((result) => result.error);
  if (failed?.error) return dbFailure(failed.error);

  const refreshed = await revalidatePublic([publicPaths.home, publicPaths.blog, publicPaths.projects]);
  return { ok: true, warning: refreshed ? undefined : REVALIDATE_WARNING };
}
