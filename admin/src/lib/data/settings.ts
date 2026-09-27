import type { Update } from "@/lib/types";
import { type DB } from "./shared";

// home_copy is left out: it belonged to an earlier home page design and nothing reads it.
const COLUMNS =
  "id, full_name, headline, intro, bio_md, now_md, location, email, avatar_url, avatar_alt, resume_url, socials, skills, interests, site_title, site_description, site_url, og_image_url, updated_at" as const;

/** The singleton row (id = 1). The migration seeds it, so it always exists. */
export async function getSettings(db: DB) {
  const { data, error } = await db.from("site_settings").select(COLUMNS).eq("id", 1).maybeSingle();
  if (error) throw new Error(`Could not load the site settings: ${error.message}`);
  if (!data) throw new Error("The site_settings row is missing. Run the database migration, which seeds it.");
  return data;
}

export type SettingsRecord = Awaited<ReturnType<typeof getSettings>>;

export type SettingsWrite = Omit<Update<"site_settings">, "id" | "updated_at">;

export function updateSettings(db: DB, values: SettingsWrite) {
  return db.from("site_settings").update(values).eq("id", 1).select("updated_at").single();
}
