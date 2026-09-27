"use server";

import { dbFailure, fail, invalid, REVALIDATE_WARNING, type ActionResult } from "@/lib/action-result";
import { ensureAdmin } from "@/lib/auth";
import {
  deleteBackground,
  getBackgroundRef,
  insertBackground,
  updateBackground,
  updateBackgroundSettings,
  type BackgroundRow,
} from "@/lib/data/backgrounds";
import { allListPaths } from "@/lib/paths";
import { revalidatePublic } from "@/lib/revalidate";
import { backgroundSchema, backgroundSettingsSchema, idListSchema, type BackgroundInput, type BackgroundSettingsInput } from "@/lib/schemas";

const NAME_TAKEN = "Another background already has this name.";

/** A background sits behind every page, so every change refreshes the whole site. */
const refreshAll = () => revalidatePublic(allListPaths, { all: true });

export async function saveBackground(id: string | null, input: BackgroundInput): Promise<ActionResult<BackgroundRow>> {
  const gate = await ensureAdmin();
  if (!gate.ok) return fail(gate.error);

  const parsed = backgroundSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const db = gate.supabase;
  if (id && !(await getBackgroundRef(db, id))) return fail("This background no longer exists.");

  const values = { ...parsed.data, light_url: parsed.data.light_url as string };
  const { data, error } = id ? await updateBackground(db, id, values) : await insertBackground(db, values);
  if (error) return dbFailure(error, { uniqueMessage: NAME_TAKEN, uniqueField: "name" });
  if (!data) return fail("The background was not saved.");

  const refreshed = await refreshAll();
  return { ok: true, data, warning: refreshed ? undefined : REVALIDATE_WARNING };
}

/** Deleting the default leaves the site without a background (the column is set to null). */
export async function removeBackground(id: string): Promise<ActionResult> {
  const gate = await ensureAdmin();
  if (!gate.ok) return fail(gate.error);

  const db = gate.supabase;
  if (!(await getBackgroundRef(db, id))) return fail("This background no longer exists.");

  const { error } = await deleteBackground(db, id);
  if (error) return dbFailure(error);

  const refreshed = await refreshAll();
  return { ok: true, warning: refreshed ? undefined : REVALIDATE_WARNING };
}

export async function reorderBackgrounds(ids: string[]): Promise<ActionResult> {
  const gate = await ensureAdmin();
  if (!gate.ok) return fail(gate.error);

  const parsed = idListSchema.safeParse(ids);
  if (!parsed.success) return fail("The new order could not be read.");

  const db = gate.supabase;
  const results = await Promise.all(parsed.data.map((id, position) => db.from("backgrounds").update({ position }).eq("id", id)));
  const failed = results.find((result) => result.error);
  if (failed?.error) return dbFailure(failed.error);

  const refreshed = await refreshAll();
  return { ok: true, warning: refreshed ? undefined : REVALIDATE_WARNING };
}

export async function saveBackgroundSettings(input: BackgroundSettingsInput): Promise<ActionResult> {
  const gate = await ensureAdmin();
  if (!gate.ok) return fail(gate.error);

  const parsed = backgroundSettingsSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const { error } = await updateBackgroundSettings(gate.supabase, parsed.data);
  if (error) return dbFailure(error);

  const refreshed = await refreshAll();
  return { ok: true, warning: refreshed ? undefined : REVALIDATE_WARNING };
}
