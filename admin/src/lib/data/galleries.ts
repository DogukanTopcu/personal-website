import type { Insert, Update } from "@/lib/types";
import { type DB, UUID_PATTERN, unwrap } from "./shared";

const GALLERY_COLUMNS = "id, slug, title, description, cover_url, position, updated_at, gallery_items(count)" as const;

const ITEM_COLUMNS =
  "id, gallery_id, title, caption, alt, media_url, media_type, poster_url, width, height, made_on, meta, tags, featured, position, status, published_at, updated_at" as const;

/* -------------------------------------------------------------- galleries -- */

export async function listGalleries(db: DB) {
  const result = await db.from("galleries").select(GALLERY_COLUMNS).order("position").order("created_at");
  return unwrap(result, "galleries");
}

export type GalleryRow = Awaited<ReturnType<typeof listGalleries>>[number];

export async function getGallery(db: DB, id: string) {
  if (!UUID_PATTERN.test(id)) return null;
  const { data, error } = await db
    .from("galleries")
    .select("id, slug, title, description, cover_url, position")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Could not load the gallery: ${error.message}`);
  return data;
}

export type GalleryRecord = NonNullable<Awaited<ReturnType<typeof getGallery>>>;

export type GalleryWrite = Pick<Insert<"galleries">, "title" | "slug" | "description" | "cover_url">;

export async function insertGallery(db: DB, values: GalleryWrite) {
  const { data: last } = await db
    .from("galleries")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  return db
    .from("galleries")
    .insert({ ...values, position: last ? last.position + 1 : 0 })
    .select("id, slug")
    .single();
}

export function updateGallery(db: DB, id: string, values: GalleryWrite) {
  return db.from("galleries").update(values).eq("id", id).select("id, slug").single();
}

export function deleteGallery(db: DB, id: string) {
  return db.from("galleries").delete().eq("id", id);
}

/* ------------------------------------------------------------------ items -- */

export async function listGalleryItems(db: DB, galleryId: string) {
  const result = await db
    .from("gallery_items")
    .select(ITEM_COLUMNS)
    .eq("gallery_id", galleryId)
    .order("position")
    .order("created_at");
  return unwrap(result, "gallery items");
}

export type GalleryItemRow = Awaited<ReturnType<typeof listGalleryItems>>[number];

export async function nextItemPosition(db: DB, galleryId: string): Promise<number> {
  const { data } = await db
    .from("gallery_items")
    .select("position")
    .eq("gallery_id", galleryId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? data.position + 1 : 0;
}

export function insertGalleryItems(db: DB, rows: Insert<"gallery_items">[]) {
  return db.from("gallery_items").insert(rows).select(ITEM_COLUMNS);
}

export type GalleryItemWrite = Pick<
  Update<"gallery_items">,
  "title" | "caption" | "alt" | "poster_url" | "made_on" | "meta" | "tags" | "featured" | "status"
>;

export function updateGalleryItem(db: DB, id: string, values: GalleryItemWrite) {
  return db.from("gallery_items").update(values).eq("id", id).select(ITEM_COLUMNS).single();
}

export async function getGalleryItemRef(db: DB, id: string) {
  const { data } = await db.from("gallery_items").select("id, gallery_id, title").eq("id", id).maybeSingle();
  return data;
}

export function deleteGalleryItem(db: DB, id: string) {
  return db.from("gallery_items").delete().eq("id", id);
}
