"use server";

import { dbFailure, fail, invalid, REVALIDATE_WARNING, type ActionResult, type SavedContent } from "@/lib/action-result";
import { ensureAdmin } from "@/lib/auth";
import { deleteProject, getProjectRef, insertProject, updateProject } from "@/lib/data/projects";
import { publicPaths } from "@/lib/paths";
import { revalidatePublic } from "@/lib/revalidate";
import { projectSchema, type ProjectInput } from "@/lib/schemas";

function pathsFor(...slugs: Array<string | null | undefined>) {
  return [publicPaths.home, publicPaths.projects, ...slugs.map((slug) => (slug ? publicPaths.project(slug) : null))];
}

export async function saveProject(id: string | null, input: ProjectInput): Promise<ActionResult<SavedContent>> {
  const gate = await ensureAdmin();
  if (!gate.ok) return fail(gate.error);

  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const db = gate.supabase;
  const previous = id ? await getProjectRef(db, id) : null;
  if (id && !previous) return fail("This project no longer exists. It may have been deleted in another tab.");

  const values = { ...parsed.data, ended_on: parsed.data.is_ongoing ? null : parsed.data.ended_on };
  const { data, error } = id ? await updateProject(db, id, values) : await insertProject(db, values);
  if (error) return dbFailure(error);
  if (!data) return fail("The project was not saved.");

  const refreshed = await revalidatePublic(pathsFor(data.slug, previous?.slug));
  return { ok: true, data, warning: refreshed ? undefined : REVALIDATE_WARNING };
}

export async function removeProject(id: string): Promise<ActionResult> {
  const gate = await ensureAdmin();
  if (!gate.ok) return fail(gate.error);

  const db = gate.supabase;
  const previous = await getProjectRef(db, id);
  if (!previous) return fail("This project no longer exists.");

  const { error } = await deleteProject(db, id);
  if (error) return dbFailure(error);

  const refreshed = await revalidatePublic(pathsFor(previous.slug));
  return { ok: true, warning: refreshed ? undefined : REVALIDATE_WARNING };
}
