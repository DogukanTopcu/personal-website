import type { Insert } from "@/lib/types";
import {
  type DB,
  type ListParams,
  UUID_PATTERN,
  isRangeError,
  likePattern,
  pageRange,
  toListResult,
} from "./shared";

const LIST_COLUMNS = "id, slug, title, kind, venue, year, status, featured, published_at, updated_at" as const;

const EDIT_COLUMNS =
  "id, slug, title, authors, kind, venue, year, published_on, abstract, keywords, pdf_url, doi, url, bibtex, featured, status, published_at, created_at, updated_at" as const;

const SAVED_COLUMNS = "id, slug, status, published_at, updated_at" as const;

export async function listPublications(db: DB, params: ListParams) {
  let query = db
    .from("publications")
    .select(LIST_COLUMNS, { count: "exact" })
    .order("updated_at", { ascending: false });

  if (params.q) query = query.ilike("title", likePattern(params.q));
  if (params.status !== "all") query = query.eq("status", params.status);

  const [from, to] = pageRange(params.page);
  const { data, count, error } = await query.range(from, to);
  if (error && !isRangeError(error)) throw new Error(`Could not load publications: ${error.message}`);
  return toListResult(data, count, params.page);
}

export type PublicationListRow = Awaited<ReturnType<typeof listPublications>>["rows"][number];

export async function getPublication(db: DB, id: string) {
  if (!UUID_PATTERN.test(id)) return null;
  const { data, error } = await db.from("publications").select(EDIT_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw new Error(`Could not load the publication: ${error.message}`);
  return data;
}

export type PublicationRecord = NonNullable<Awaited<ReturnType<typeof getPublication>>>;

export type PublicationWrite = Pick<
  Insert<"publications">,
  | "title"
  | "slug"
  | "authors"
  | "kind"
  | "venue"
  | "year"
  | "published_on"
  | "abstract"
  | "keywords"
  | "pdf_url"
  | "doi"
  | "url"
  | "bibtex"
  | "featured"
  | "status"
  | "published_at"
>;

export function insertPublication(db: DB, values: PublicationWrite) {
  return db.from("publications").insert(values).select(SAVED_COLUMNS).single();
}

export function updatePublication(db: DB, id: string, values: PublicationWrite) {
  return db.from("publications").update(values).eq("id", id).select(SAVED_COLUMNS).single();
}

export async function getPublicationRef(db: DB, id: string) {
  const { data } = await db.from("publications").select("id, slug, title, status").eq("id", id).maybeSingle();
  return data;
}

export function deletePublication(db: DB, id: string) {
  return db.from("publications").delete().eq("id", id);
}
