"use server";

import { dbFailure, fail, invalid, REVALIDATE_WARNING, type ActionResult, type SavedContent } from "@/lib/action-result";
import { ensureAdmin } from "@/lib/auth";
import { deletePublication, getPublicationRef, insertPublication, updatePublication } from "@/lib/data/publications";
import { publicPaths } from "@/lib/paths";
import { revalidatePublic } from "@/lib/revalidate";
import { publicationSchema, type PublicationInput } from "@/lib/schemas";

function pathsFor(...slugs: Array<string | null | undefined>) {
  return [publicPaths.home, publicPaths.research, ...slugs.map((slug) => (slug ? publicPaths.citation(slug) : null))];
}

export async function savePublication(id: string | null, input: PublicationInput): Promise<ActionResult<SavedContent>> {
  const gate = await ensureAdmin();
  if (!gate.ok) return fail(gate.error);

  const parsed = publicationSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const db = gate.supabase;
  const previous = id ? await getPublicationRef(db, id) : null;
  if (id && !previous) return fail("This publication no longer exists. It may have been deleted in another tab.");

  const { data, error } = id ? await updatePublication(db, id, parsed.data) : await insertPublication(db, parsed.data);
  if (error) return dbFailure(error);
  if (!data) return fail("The publication was not saved.");

  const refreshed = await revalidatePublic(pathsFor(data.slug, previous?.slug));
  return { ok: true, data, warning: refreshed ? undefined : REVALIDATE_WARNING };
}

export async function removePublication(id: string): Promise<ActionResult> {
  const gate = await ensureAdmin();
  if (!gate.ok) return fail(gate.error);

  const db = gate.supabase;
  const previous = await getPublicationRef(db, id);
  if (!previous) return fail("This publication no longer exists.");

  const { error } = await deletePublication(db, id);
  if (error) return dbFailure(error);

  const refreshed = await revalidatePublic(pathsFor(previous.slug));
  return { ok: true, warning: refreshed ? undefined : REVALIDATE_WARNING };
}
