"use server";

import { z } from "zod";
import { dbFailure, fail, invalid, REVALIDATE_WARNING, type ActionResult } from "@/lib/action-result";
import { ensureAdmin } from "@/lib/auth";
import {
  deleteGallery,
  deleteGalleryItem,
  getGallery,
  getGalleryItemRef,
  insertGallery,
  insertGalleryItems,
  nextItemPosition,
  updateGallery,
  updateGalleryItem,
  type GalleryItemRow,
} from "@/lib/data/galleries";
import { publicPaths } from "@/lib/paths";
import { revalidatePublic } from "@/lib/revalidate";
import {
  galleryItemSchema,
  gallerySchema,
  idListSchema,
  newGalleryItemSchema,
  type GalleryInput,
  type GalleryItemInput,
  type NewGalleryItemInput,
} from "@/lib/schemas";

function pathsFor(...slugs: Array<string | null | undefined>) {
  return [publicPaths.home, publicPaths.galleries, ...slugs.map((slug) => (slug ? publicPaths.gallery(slug) : null))];
}

const GALLERY_UNIQUE = "Another gallery already uses this slug.";

export async function saveGallery(id: string | null, input: GalleryInput): Promise<ActionResult<{ id: string; slug: string }>> {
  const gate = await ensureAdmin();
  if (!gate.ok) return fail(gate.error);

  const parsed = gallerySchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const db = gate.supabase;
  const previous = id ? await getGallery(db, id) : null;
  if (id && !previous) return fail("This gallery no longer exists.");

  const { data, error } = id ? await updateGallery(db, id, parsed.data) : await insertGallery(db, parsed.data);
  if (error) return dbFailure(error, { uniqueMessage: GALLERY_UNIQUE });
  if (!data) return fail("The gallery was not saved.");

  const refreshed = await revalidatePublic(pathsFor(data.slug, previous?.slug));
  return { ok: true, data, warning: refreshed ? undefined : REVALIDATE_WARNING };
}

export async function removeGallery(id: string): Promise<ActionResult> {
  const gate = await ensureAdmin();
  if (!gate.ok) return fail(gate.error);

  const db = gate.supabase;
  const previous = await getGallery(db, id);
  if (!previous) return fail("This gallery no longer exists.");

  const { error } = await deleteGallery(db, id);
  if (error) return dbFailure(error);

  const refreshed = await revalidatePublic(pathsFor(previous.slug));
  return { ok: true, warning: refreshed ? undefined : REVALIDATE_WARNING };
}

export async function reorderGalleries(ids: string[]): Promise<ActionResult> {
  const gate = await ensureAdmin();
  if (!gate.ok) return fail(gate.error);

  const parsed = idListSchema.safeParse(ids);
  if (!parsed.success) return fail("The new order could not be read.");

  const db = gate.supabase;
  const results = await Promise.all(parsed.data.map((id, position) => db.from("galleries").update({ position }).eq("id", id)));
  const failed = results.find((result) => result.error);
  if (failed?.error) return dbFailure(failed.error);

  const refreshed = await revalidatePublic(pathsFor());
  return { ok: true, warning: refreshed ? undefined : REVALIDATE_WARNING };
}

/* ------------------------------------------------------------------ items -- */

/** Uploaded or picked files join the gallery, published, at the end. */
export async function addGalleryItems(galleryId: string, items: NewGalleryItemInput[]): Promise<ActionResult<GalleryItemRow[]>> {
  const gate = await ensureAdmin();
  if (!gate.ok) return fail(gate.error);

  const parsed = z.array(newGalleryItemSchema).min(1).max(200).safeParse(items);
  if (!parsed.success) return invalid(parsed.error);

  const db = gate.supabase;
  const gallery = await getGallery(db, galleryId);
  if (!gallery) return fail("This gallery no longer exists.");

  const start = await nextItemPosition(db, galleryId);
  const { data, error } = await insertGalleryItems(
    db,
    parsed.data.map((item, index) => ({
      gallery_id: galleryId,
      media_url: item.media_url,
      media_type: item.media_type,
      title: item.title,
      alt: item.alt,
      width: item.width,
      height: item.height,
      status: "published",
      position: start + index,
    })),
  );
  if (error) return dbFailure(error);
  if (!data) return fail("The items were not added.");

  const refreshed = await revalidatePublic(pathsFor(gallery.slug));
  return { ok: true, data, warning: refreshed ? undefined : REVALIDATE_WARNING };
}

export async function saveGalleryItem(id: string, input: GalleryItemInput): Promise<ActionResult<GalleryItemRow>> {
  const gate = await ensureAdmin();
  if (!gate.ok) return fail(gate.error);

  const parsed = galleryItemSchema.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);

  const db = gate.supabase;
  const previous = await getGalleryItemRef(db, id);
  if (!previous) return fail("This item no longer exists.");
  const gallery = await getGallery(db, previous.gallery_id);

  const { meta, ...rest } = parsed.data;
  const { data, error } = await updateGalleryItem(db, id, {
    ...rest,
    meta: Object.fromEntries(meta.map((entry) => [entry.key, entry.value])),
  });
  if (error) return dbFailure(error);
  if (!data) return fail("The item was not saved.");

  const refreshed = await revalidatePublic(pathsFor(gallery?.slug));
  return { ok: true, data, warning: refreshed ? undefined : REVALIDATE_WARNING };
}

export async function removeGalleryItem(id: string): Promise<ActionResult> {
  const gate = await ensureAdmin();
  if (!gate.ok) return fail(gate.error);

  const db = gate.supabase;
  const previous = await getGalleryItemRef(db, id);
  if (!previous) return fail("This item no longer exists.");
  const gallery = await getGallery(db, previous.gallery_id);

  const { error } = await deleteGalleryItem(db, id);
  if (error) return dbFailure(error);

  const refreshed = await revalidatePublic(pathsFor(gallery?.slug));
  return { ok: true, warning: refreshed ? undefined : REVALIDATE_WARNING };
}

export async function reorderGalleryItems(galleryId: string, ids: string[]): Promise<ActionResult> {
  const gate = await ensureAdmin();
  if (!gate.ok) return fail(gate.error);

  const parsed = idListSchema.safeParse(ids);
  if (!parsed.success) return fail("The new order could not be read.");

  const db = gate.supabase;
  const gallery = await getGallery(db, galleryId);
  if (!gallery) return fail("This gallery no longer exists.");

  const results = await Promise.all(
    parsed.data.map((id, position) =>
      db.from("gallery_items").update({ position }).eq("id", id).eq("gallery_id", galleryId),
    ),
  );
  const failed = results.find((result) => result.error);
  if (failed?.error) return dbFailure(failed.error);

  const refreshed = await revalidatePublic(pathsFor(gallery.slug));
  return { ok: true, warning: refreshed ? undefined : REVALIDATE_WARNING };
}
