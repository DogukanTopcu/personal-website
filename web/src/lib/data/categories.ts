import { cache } from "react";
import { publicDb } from "@/lib/supabase/server";
import type { Category } from "./types";
import { reportDataError } from "./util";

export const listCategories = cache(async (kind: "post" | "project"): Promise<Category[]> => {
  const db = publicDb();
  if (!db) return [];
  const { data, error } = await db.from("categories").select("*").eq("kind", kind).order("position", { ascending: true });
  reportDataError(`categories:${kind}`, error);
  return data ?? [];
});
