import type { Insert } from "@/lib/types";
import { type DB, likePattern, quoteFilterValue } from "./shared";

export const MEDIA_PAGE_SIZE = 48;

export type MediaKind = "image" | "video" | "audio" | "pdf" | "other";
export const MEDIA_KINDS: MediaKind[] = ["image", "video", "audio", "pdf", "other"];

export const MEDIA_KIND_LABELS: Record<MediaKind, string> = {
  image: "Images",
  video: "Video",
  audio: "Audio",
  pdf: "PDF",
  other: "Other",
};

const COLUMNS = "id, path, url, mime_type, size_bytes, width, height, alt, created_at" as const;

export function kindOfMime(mime: string): MediaKind {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (mime === "application/pdf") return "pdf";
  return "other";
}

/** "image/*,application/pdf" gives ["image", "pdf"]. An empty list means anything goes. */
export function kindsFromAccept(accept: string | undefined): MediaKind[] {
  if (!accept) return [];
  const kinds = new Set<MediaKind>();
  for (const token of accept.split(",").map((part) => part.trim().toLowerCase())) {
    if (token.startsWith("image/")) kinds.add("image");
    else if (token.startsWith("video/")) kinds.add("video");
    else if (token.startsWith("audio/")) kinds.add("audio");
    else if (token === "application/pdf" || token === ".pdf") kinds.add("pdf");
  }
  return [...kinds];
}

const KIND_FILTER: Record<Exclude<MediaKind, "other">, string> = {
  image: "mime_type.like.image/%",
  video: "mime_type.like.video/%",
  audio: "mime_type.like.audio/%",
  pdf: "mime_type.eq.application/pdf",
};

export type MediaQuery = {
  q: string;
  /** The filter chosen in the UI. */
  kind: MediaKind | "all";
  /** What the caller accepts at all (from an `accept` string). */
  allowed: MediaKind[];
  offset: number;
};

export async function listMedia(db: DB, { q, kind, allowed, offset }: MediaQuery) {
  let query = db.from("media_assets").select(COLUMNS, { count: "exact" }).order("created_at", { ascending: false });

  const kinds = kind === "all" ? allowed : [kind];
  if (kinds.length === 1 && kinds[0] === "other") {
    query = query
      .not("mime_type", "like", "image/%")
      .not("mime_type", "like", "video/%")
      .not("mime_type", "like", "audio/%")
      .neq("mime_type", "application/pdf");
  } else if (kinds.length > 0) {
    const filters = kinds.filter((entry): entry is Exclude<MediaKind, "other"> => entry !== "other");
    query = query.or(filters.map((entry) => KIND_FILTER[entry]).join(","));
  }

  const text = q.trim();
  if (text) {
    const pattern = quoteFilterValue(likePattern(text));
    query = query.or(`path.ilike.${pattern},alt.ilike.${pattern}`);
  }

  const { data, count, error } = await query.range(offset, offset + MEDIA_PAGE_SIZE - 1);
  if (error && error.code !== "PGRST103") throw new Error(`Could not load the media library: ${error.message}`);
  return { assets: data ?? [], total: count ?? 0 };
}

export type MediaAsset = Awaited<ReturnType<typeof listMedia>>["assets"][number];

export function insertMedia(db: DB, values: Insert<"media_assets">) {
  return db.from("media_assets").insert(values).select(COLUMNS).single();
}

export function updateMediaAlt(db: DB, id: string, alt: string) {
  return db.from("media_assets").update({ alt }).eq("id", id).select(COLUMNS).single();
}

export function deleteMediaRow(db: DB, id: string) {
  return db.from("media_assets").delete().eq("id", id);
}
