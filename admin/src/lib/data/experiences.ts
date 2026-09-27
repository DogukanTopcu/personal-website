import type { Insert } from "@/lib/types";
import { type DB, unwrap } from "./shared";

const COLUMNS =
  "id, kind, title, organization, location, url, start_date, end_date, is_current, summary, highlights, position, status, updated_at" as const;

export async function listExperiences(db: DB) {
  const result = await db
    .from("experiences")
    .select(COLUMNS)
    .order("position")
    .order("start_date", { ascending: false, nullsFirst: false });
  return unwrap(result, "experience entries");
}

export type ExperienceRow = Awaited<ReturnType<typeof listExperiences>>[number];

export type ExperienceWrite = Pick<
  Insert<"experiences">,
  | "kind"
  | "title"
  | "organization"
  | "location"
  | "url"
  | "start_date"
  | "end_date"
  | "is_current"
  | "summary"
  | "highlights"
  | "status"
>;

/** New entries go to the end of their own kind. */
export async function insertExperience(db: DB, values: ExperienceWrite) {
  const { data: last } = await db
    .from("experiences")
    .select("position")
    .eq("kind", values.kind)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  return db
    .from("experiences")
    .insert({ ...values, position: last ? last.position + 1 : 0 })
    .select(COLUMNS)
    .single();
}

export function updateExperience(db: DB, id: string, values: ExperienceWrite) {
  return db.from("experiences").update(values).eq("id", id).select(COLUMNS).single();
}

export function deleteExperience(db: DB, id: string) {
  return db.from("experiences").delete().eq("id", id);
}
