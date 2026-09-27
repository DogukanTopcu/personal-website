import { cache } from "react";
import { publicDb } from "@/lib/supabase/server";
import type { Background } from "./types";
import { reportDataError } from "./util";

/** Every background option, in the admin's order. Reference data, so the visitor client is enough. */
export const listBackgrounds = cache(async (): Promise<Background[]> => {
  const db = publicDb();
  if (!db) return [];
  const { data, error } = await db
    .from("backgrounds")
    .select("id, name, light_url, dark_url, veil_light, veil_dark")
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  reportDataError("backgrounds", error);
  return data ?? [];
});
