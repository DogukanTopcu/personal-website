import { cache } from "react";
import { readDb } from "@/lib/supabase/server";
import type { Experience } from "./types";
import { reportDataError } from "./util";

export const listExperiences = cache(async (): Promise<Experience[]> => {
  const { db, preview } = await readDb();
  if (!db) return [];
  let query = db.from("experiences").select("*").order("position", { ascending: true });
  query = preview ? query.neq("status", "archived") : query.eq("status", "published");
  const { data, error } = await query;
  reportDataError("experiences", error);
  return data ?? [];
});
