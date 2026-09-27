import { cache } from "react";
import { publicDb } from "@/lib/supabase/server";
import type { Settings, SkillGroup, Social } from "./types";
import { asArray, asRecord, isObject, reportDataError } from "./util";

const EMPTY: Settings = {
  id: 1,
  full_name: "",
  headline: "",
  intro: "",
  bio_md: "",
  now_md: "",
  location: "",
  email: "",
  avatar_url: null,
  avatar_alt: "",
  resume_url: null,
  socials: [],
  skills: [],
  interests: [],
  home_copy: {},
  site_title: "",
  site_description: "",
  site_url: "",
  og_image_url: null,
  updated_at: new Date(0).toISOString(),
};

const isSocial = (v: unknown): v is Social => isObject(v) && typeof v.label === "string" && typeof v.url === "string";
const isSkillGroup = (v: unknown): v is SkillGroup =>
  isObject(v) && typeof v.group === "string" && Array.isArray(v.items) && v.items.every((i) => typeof i === "string");

/** Settings are public reference data, so the visitor client is always enough. */
export const getSettings = cache(async (): Promise<Settings> => {
  const db = publicDb();
  if (!db) return EMPTY;
  const { data, error } = await db.from("site_settings").select("*").eq("id", 1).maybeSingle();
  reportDataError("site_settings", error);
  if (!data) return EMPTY;

  const homeCopy: Settings["home_copy"] = {};
  for (const [key, value] of Object.entries(asRecord(data.home_copy))) {
    if (!isObject(value)) continue;
    homeCopy[key] = {
      heading: typeof value.heading === "string" && value.heading.trim() ? value.heading : undefined,
      body: typeof value.body === "string" && value.body.trim() ? value.body : undefined,
    };
  }

  return {
    ...data,
    socials: asArray(data.socials, isSocial),
    skills: asArray(data.skills, isSkillGroup),
    home_copy: homeCopy,
  };
});

/** Where "Get in touch" goes: email if there is one, otherwise the first social link. */
export function contactHref(settings: Settings): string {
  if (settings.email) return `mailto:${settings.email}`;
  const linkedin = settings.socials.find((s) => /linkedin/i.test(s.label) || /linkedin\.com/i.test(s.url));
  return linkedin?.url ?? settings.socials[0]?.url ?? "/about";
}
