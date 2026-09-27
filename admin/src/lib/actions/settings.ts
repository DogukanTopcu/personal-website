"use server";

import { dbFailure, fail, invalid, REVALIDATE_WARNING, type ActionResult } from "@/lib/action-result";
import { ensureAdmin } from "@/lib/auth";
import { updateSettings } from "@/lib/data/settings";
import { allListPaths } from "@/lib/paths";
import { revalidatePublic } from "@/lib/revalidate";
import { settingsSchema, type SettingsInput } from "@/lib/schemas";

/**
 * Site settings show up in the header and footer of every page, so the whole
 * site is refreshed, not only the pages that list them.
 */
export async function saveSettings(input: SettingsInput): Promise<ActionResult<{ updated_at: string }>> {
  const gate = await ensureAdmin();
  if (!gate.ok) return fail(gate.error);

  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const { data, error } = await updateSettings(gate.supabase, parsed.data);
  if (error) return dbFailure(error);
  if (!data) return fail("The settings were not saved.");

  const refreshed = await revalidatePublic(allListPaths, { all: true });
  return { ok: true, data, warning: refreshed ? undefined : REVALIDATE_WARNING };
}
