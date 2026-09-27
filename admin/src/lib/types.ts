import type { Database, Json } from "@/lib/supabase/database.types";

export type Tables = Database["public"]["Tables"];
export type Row<T extends keyof Tables> = Tables[T]["Row"];
export type Insert<T extends keyof Tables> = Tables[T]["Insert"];
export type Update<T extends keyof Tables> = Tables[T]["Update"];

export type ContentStatus = Database["public"]["Enums"]["content_status"];
export const CONTENT_STATUSES: ContentStatus[] = ["draft", "published", "archived"];

/* --------------------------------------------------------- JSON columns -- */

/** posts.review */
export type Review = {
  subject: string;
  creator: string;
  year: number | null;
  rating: number | null;
  verdict: string;
};

/** projects.gallery */
export type GalleryImage = { url: string; alt: string; caption: string };

/** site_settings.socials */
export type Social = { label: string; url: string; handle: string };

/** site_settings.skills */
export type SkillGroup = { group: string; items: string[] };

/** gallery_items.meta */
export type MetaEntries = Array<{ key: string; value: string }>;

/* ------------------------------------------------------------ enumerations -- */

export const REVIEW_CATEGORY_SLUGS = ["books", "films", "games"] as const;
export type ReviewCategorySlug = (typeof REVIEW_CATEGORY_SLUGS)[number];

export const COURSE_LEVELS = ["beginner", "intermediate", "advanced"] as const;
export type CourseLevel = (typeof COURSE_LEVELS)[number];

export const COURSE_RELATIONS = ["prerequisite", "next", "related"] as const;
export type CourseRelation = (typeof COURSE_RELATIONS)[number];

export const STORY_FORMATS = ["novel", "novella", "short-story", "collection", "serial"] as const;
export type StoryFormat = (typeof STORY_FORMATS)[number];

export const PUBLICATION_KINDS = ["thesis", "journal", "conference", "preprint", "report", "talk"] as const;
export type PublicationKind = (typeof PUBLICATION_KINDS)[number];

export const EXPERIENCE_KINDS = ["work", "venture", "education", "leadership", "award"] as const;
export type ExperienceKind = (typeof EXPERIENCE_KINDS)[number];

export const CATEGORY_KINDS = ["post", "project"] as const;
export type CategoryKind = (typeof CATEGORY_KINDS)[number];

export const LABELS = {
  status: { draft: "Draft", published: "Published", archived: "Archived" } satisfies Record<ContentStatus, string>,
  level: { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" } satisfies Record<CourseLevel, string>,
  relation: {
    prerequisite: "Prerequisite",
    next: "Take next",
    related: "Related",
  } satisfies Record<CourseRelation, string>,
  format: {
    novel: "Novel",
    novella: "Novella",
    "short-story": "Short story",
    collection: "Collection",
    serial: "Serial",
  } satisfies Record<StoryFormat, string>,
  publicationKind: {
    thesis: "Thesis",
    journal: "Journal article",
    conference: "Conference paper",
    preprint: "Preprint",
    report: "Report",
    talk: "Talk",
  } satisfies Record<PublicationKind, string>,
  experienceKind: {
    work: "Work",
    venture: "Ventures",
    education: "Education",
    leadership: "Leadership",
    award: "Awards",
  } satisfies Record<ExperienceKind, string>,
  categoryKind: { post: "Post categories", project: "Project categories" } satisfies Record<CategoryKind, string>,
} as const;

/* -------------------------------------------------- reading JSON columns -- */

type JsonObject = { [key: string]: Json | undefined };

function isRecord(value: Json | undefined): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: Json | undefined): string {
  return typeof value === "string" ? value : "";
}

function numberOrNull(value: Json | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function stringList(value: Json | undefined): string[] {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

export function parseReview(json: Json | null | undefined): Review | null {
  if (!isRecord(json)) return null;
  return {
    subject: text(json.subject),
    creator: text(json.creator),
    year: numberOrNull(json.year),
    rating: numberOrNull(json.rating),
    verdict: text(json.verdict),
  };
}

export const EMPTY_REVIEW: Review = { subject: "", creator: "", year: null, rating: null, verdict: "" };

export function parseGalleryImages(json: Json | null | undefined): GalleryImage[] {
  if (!Array.isArray(json)) return [];
  return json
    .filter(isRecord)
    .map((item) => ({ url: text(item.url), alt: text(item.alt), caption: text(item.caption) }))
    .filter((item) => item.url !== "");
}

export function parseSocials(json: Json | null | undefined): Social[] {
  if (!Array.isArray(json)) return [];
  return json
    .filter(isRecord)
    .map((item) => ({ label: text(item.label), url: text(item.url), handle: text(item.handle) }));
}

export function parseSkills(json: Json | null | undefined): SkillGroup[] {
  if (!Array.isArray(json)) return [];
  return json.filter(isRecord).map((item) => ({
    group: text(item.group),
    items: stringList(item.items),
  }));
}

export function parseMeta(json: Json | null | undefined): MetaEntries {
  if (!isRecord(json)) return [];
  return Object.entries(json).map(([key, value]) => ({
    key,
    value: typeof value === "string" ? value : value === null || value === undefined ? "" : JSON.stringify(value),
  }));
}
