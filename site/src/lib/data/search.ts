import { publicDb } from "@/lib/supabase/server";
import { reportDataError } from "./util";

export type SearchHit = { kind: string; title: string; summary: string; url: string; rank: number };

export async function searchSite(q: string): Promise<SearchHit[]> {
  const db = publicDb();
  const term = q.trim().slice(0, 120);
  if (!db || term.length < 2) return [];
  const { data, error } = await db.rpc("search_site", { q: term, max_results: 30 });
  reportDataError("search_site", error);
  return (data ?? []) as SearchHit[];
}
