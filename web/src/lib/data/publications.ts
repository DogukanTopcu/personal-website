import { cache } from "react";
import { readDb } from "@/lib/supabase/server";
import type { Publication } from "./types";
import { nowIso, reportDataError } from "./util";

const COLUMNS =
  "id, slug, title, authors, kind, venue, year, published_on, abstract, keywords, pdf_url, doi, url, bibtex, featured, status, published_at, created_at, updated_at";

export const listPublications = cache(async (): Promise<Publication[]> => {
  const { db, preview } = await readDb();
  if (!db) return [];
  let query = db.from("publications").select(COLUMNS);
  query = preview ? query.neq("status", "archived") : query.eq("status", "published").lte("published_at", nowIso());
  const { data, error } = await query.order("year", { ascending: false }).order("published_on", { ascending: false, nullsFirst: false });
  reportDataError("publications", error);
  return (data ?? []) as Publication[];
});

export const getPublication = cache(async (slug: string): Promise<Publication | null> => {
  const { db, preview } = await readDb();
  if (!db) return null;
  let query = db.from("publications").select(COLUMNS).eq("slug", slug);
  if (!preview) query = query.eq("status", "published").lte("published_at", nowIso());
  const { data, error } = await query.maybeSingle();
  reportDataError(`publication:${slug}`, error);
  return (data as Publication | null) ?? null;
});
