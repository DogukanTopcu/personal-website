"use server";

import { dbFailure, fail, invalid, REVALIDATE_WARNING, type ActionResult } from "@/lib/action-result";
import { ensureAdmin } from "@/lib/auth";
import { deleteExperience, insertExperience, updateExperience, type ExperienceRow } from "@/lib/data/experiences";
import { publicPaths } from "@/lib/paths";
import { revalidatePublic } from "@/lib/revalidate";
import { experienceSchema, idListSchema, type ExperienceInput } from "@/lib/schemas";

const PATHS = [publicPaths.home, publicPaths.about];

export async function saveExperience(id: string | null, input: ExperienceInput): Promise<ActionResult<ExperienceRow>> {
  const gate = await ensureAdmin();
  if (!gate.ok) return fail(gate.error);

  const parsed = experienceSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const values = { ...parsed.data, end_date: parsed.data.is_current ? null : parsed.data.end_date };
  const db = gate.supabase;
  const { data, error } = id ? await updateExperience(db, id, values) : await insertExperience(db, values);
  if (error) return dbFailure(error);
  if (!data) return fail("The entry was not saved.");

  const refreshed = await revalidatePublic(PATHS);
  return { ok: true, data, warning: refreshed ? undefined : REVALIDATE_WARNING };
}

export async function removeExperience(id: string): Promise<ActionResult> {
  const gate = await ensureAdmin();
  if (!gate.ok) return fail(gate.error);

  const { error } = await deleteExperience(gate.supabase, id);
  if (error) return dbFailure(error);

  const refreshed = await revalidatePublic(PATHS);
  return { ok: true, warning: refreshed ? undefined : REVALIDATE_WARNING };
}

/** New order within one kind. Positions restart at zero per kind. */
export async function reorderExperiences(ids: string[]): Promise<ActionResult> {
  const gate = await ensureAdmin();
  if (!gate.ok) return fail(gate.error);

  const parsed = idListSchema.safeParse(ids);
  if (!parsed.success) return fail("The new order could not be read.");

  const db = gate.supabase;
  const results = await Promise.all(parsed.data.map((id, position) => db.from("experiences").update({ position }).eq("id", id)));
  const failed = results.find((result) => result.error);
  if (failed?.error) return dbFailure(failed.error);

  const refreshed = await revalidatePublic(PATHS);
  return { ok: true, warning: refreshed ? undefined : REVALIDATE_WARNING };
}
