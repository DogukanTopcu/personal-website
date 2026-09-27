"use server";

import { dbFailure, fail, invalid, REVALIDATE_WARNING, type ActionResult, type SavedContent } from "@/lib/action-result";
import { ensureAdmin } from "@/lib/auth";
import { deletePost, getPostRef, insertPost, updatePost } from "@/lib/data/posts";
import { publicPaths } from "@/lib/paths";
import { revalidatePublic } from "@/lib/revalidate";
import { postSchema, type PostInput } from "@/lib/schemas";

function pathsFor(...slugs: Array<string | null | undefined>) {
  return [publicPaths.home, publicPaths.blog, ...slugs.map((slug) => (slug ? publicPaths.post(slug) : null))];
}

export async function savePost(id: string | null, input: PostInput): Promise<ActionResult<SavedContent>> {
  const gate = await ensureAdmin();
  if (!gate.ok) return fail(gate.error);

  const parsed = postSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const db = gate.supabase;
  const previous = id ? await getPostRef(db, id) : null;
  if (id && !previous) return fail("This post no longer exists. It may have been deleted in another tab.");

  const { data, error } = id ? await updatePost(db, id, parsed.data) : await insertPost(db, parsed.data);
  if (error) return dbFailure(error);
  if (!data) return fail("The post was not saved.");

  const refreshed = await revalidatePublic(pathsFor(data.slug, previous?.slug));
  return { ok: true, data, warning: refreshed ? undefined : REVALIDATE_WARNING };
}

export async function removePost(id: string): Promise<ActionResult> {
  const gate = await ensureAdmin();
  if (!gate.ok) return fail(gate.error);

  const db = gate.supabase;
  const previous = await getPostRef(db, id);
  if (!previous) return fail("This post no longer exists.");

  const { error } = await deletePost(db, id);
  if (error) return dbFailure(error);

  const refreshed = await revalidatePublic(pathsFor(previous.slug));
  return { ok: true, warning: refreshed ? undefined : REVALIDATE_WARNING };
}
