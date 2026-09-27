import { cache } from "react";
import { publicDb, readDb } from "@/lib/supabase/server";
import type { Gallery, GalleryItem } from "./types";
import { asRecord, nowIso, reportDataError } from "./util";

function toItem(row: Record<string, unknown> & { meta: unknown }): GalleryItem {
  const meta: Record<string, string> = {};
  for (const [key, value] of Object.entries(asRecord(row.meta as never))) {
    if (typeof value === "string" || typeof value === "number") meta[key] = String(value);
  }
  return { ...(row as unknown as GalleryItem), meta };
}

export const listGalleries = cache(async (): Promise<Gallery[]> => {
  const db = publicDb();
  if (!db) return [];
  const { data, error } = await db.from("galleries").select("*").order("position", { ascending: true });
  reportDataError("galleries", error);
  return data ?? [];
});

export const listGalleryItems = cache(async (opts: { galleryId?: string; featured?: boolean; limit?: number } = {}): Promise<GalleryItem[]> => {
  const { db, preview } = await readDb();
  if (!db) return [];
  let query = db.from("gallery_items").select("*");
  query = preview ? query.neq("status", "archived") : query.eq("status", "published").lte("published_at", nowIso());
  if (opts.galleryId) query = query.eq("gallery_id", opts.galleryId);
  if (opts.featured) query = query.eq("featured", true);
  query = query.order("position", { ascending: true }).order("created_at", { ascending: false });
  if (opts.limit) query = query.limit(opts.limit);
  const { data, error } = await query;
  reportDataError("gallery_items", error);
  return (data ?? []).map((row) => toItem(row));
});

export const getGallery = cache(async (slug: string): Promise<{ gallery: Gallery; items: GalleryItem[] } | null> => {
  const galleries = await listGalleries();
  const gallery = galleries.find((g) => g.slug === slug);
  if (!gallery) return null;
  return { gallery, items: await listGalleryItems({ galleryId: gallery.id }) };
});

/** One query for the gallery index: every gallery with its count and first few items. */
export const listGalleriesWithPreview = cache(async (perGallery = 4) => {
  const [galleries, items] = await Promise.all([listGalleries(), listGalleryItems()]);
  return galleries.map((gallery) => {
    const own = items.filter((i) => i.gallery_id === gallery.id);
    return { gallery, count: own.length, preview: own.slice(0, perGallery) };
  });
});
