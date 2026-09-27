import type { Insert } from "@/lib/types";
import { type DB, unwrap } from "./shared";

const COLUMNS = "id, name, light_url, dark_url, veil_light, veil_dark, position, updated_at" as const;

export async function listBackgrounds(db: DB) {
  return unwrap(await db.from("backgrounds").select(COLUMNS).order("position").order("created_at"), "backgrounds");
}

export type BackgroundRow = Awaited<ReturnType<typeof listBackgrounds>>[number];

export type BackgroundWrite = Pick<Insert<"backgrounds">, "name" | "light_url" | "dark_url" | "veil_light" | "veil_dark">;

export async function insertBackground(db: DB, values: BackgroundWrite) {
  const { data: last } = await db.from("backgrounds").select("position").order("position", { ascending: false }).limit(1).maybeSingle();
  return db
    .from("backgrounds")
    .insert({ ...values, position: last ? last.position + 1 : 0 })
    .select(COLUMNS)
    .single();
}

export function updateBackground(db: DB, id: string, values: BackgroundWrite) {
  return db.from("backgrounds").update(values).eq("id", id).select(COLUMNS).single();
}

export async function getBackgroundRef(db: DB, id: string) {
  const { data } = await db.from("backgrounds").select("id, name").eq("id", id).maybeSingle();
  return data;
}

export function deleteBackground(db: DB, id: string) {
  return db.from("backgrounds").delete().eq("id", id);
}

/** The two settings that decide what visitors see: the default and whether they may choose. */
export async function getBackgroundSettings(db: DB) {
  const { data, error } = await db.from("site_settings").select("background_id, background_picker").eq("id", 1).maybeSingle();
  if (error) throw new Error(`Could not load the background settings: ${error.message}`);
  return data ?? { background_id: null, background_picker: true };
}

export function updateBackgroundSettings(db: DB, values: { background_id: string | null; background_picker: boolean }) {
  return db.from("site_settings").update(values).eq("id", 1).select("background_id, background_picker").single();
}
