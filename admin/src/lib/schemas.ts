import { z } from "zod";
import { looseInputToDate } from "@/lib/format";
import { SLUG_PATTERN } from "@/lib/slug";
import {
  CATEGORY_KINDS,
  COURSE_LEVELS,
  COURSE_RELATIONS,
  EXPERIENCE_KINDS,
  PUBLICATION_KINDS,
  STORY_FORMATS,
} from "@/lib/types";

/* ---------------------------------------------------------- building blocks -- */

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const title = z.string().trim().min(1, "A title is required.").max(240, "Keep the title under 240 characters.");

const slug = z
  .string()
  .trim()
  .min(1, "A slug is required.")
  .max(96, "Keep the slug under 96 characters.")
  .regex(SLUG_PATTERN, "Use lowercase letters, numbers and single hyphens only.");

const shortText = z.string().trim().max(400, "Keep this under 400 characters.");
const longText = z.string().trim().max(4000, "Keep this under 4000 characters.");
const markdown = z.string().max(2_000_000, "This document is too long to save in one piece.");

const status = z.enum(["draft", "published", "archived"]);

/** Empty or null becomes null. Anything else has to be a full http(s) URL. */
const optionalUrl = z
  .union([z.string(), z.null()])
  .transform((value) => (value ?? "").trim())
  .refine((value) => value.length <= 2048, "This URL is too long.")
  .refine((value) => value === "" || isHttpUrl(value), "Enter a full URL starting with http:// or https://")
  .transform((value) => (value === "" ? null : value));

const optionalId = z
  .union([z.string(), z.null()])
  .transform((value) => (value ?? "").trim())
  .transform((value) => (value === "" ? null : value))
  .pipe(z.uuid("Pick a valid option.").nullable());

/** ISO timestamp or null. Null on a published row means "now" (a trigger fills it). */
const timestamp = z
  .string()
  .nullable()
  .refine((value) => value === null || !Number.isNaN(new Date(value).getTime()), "Enter a valid date and time.")
  .transform((value) => (value ? new Date(value).toISOString() : null));

/** "YYYY-MM-DD" from a date input, or null. */
const dateOnly = z
  .union([z.string(), z.null()])
  .transform((value) => (value ?? "").trim())
  .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), "Enter a valid date.")
  .transform((value) => (value === "" ? null : value));

/** "2021", "2021-09" or "2021-09-14", or blank. */
const looseDate = z
  .string()
  .refine((value) => looseInputToDate(value) !== undefined, "Use a year (2021), a month (2021-09) or a full date.")
  .transform((value) => looseInputToDate(value) ?? null);

const tagList = z
  .array(z.string().trim().min(1).max(80, "Keep each entry under 80 characters."))
  .max(60, "That is too many entries.")
  .transform((items) => [...new Set(items)]);

const position = z.number().int("Use a whole number.").min(0, "Use zero or more.").max(100000);

const withCoverAlt = <T extends { cover_url: string | null; cover_alt: string }>(value: T, ctx: z.RefinementCtx) => {
  if (value.cover_url && value.cover_alt.trim() === "") {
    ctx.addIssue({
      code: "custom",
      path: ["cover_alt"],
      message: "Describe the cover for people who cannot see it.",
    });
  }
};

/* ------------------------------------------------------------------ posts -- */

const review = z
  .object({
    subject: z.string().trim().max(240),
    creator: z.string().trim().max(240),
    year: z.number().int("Use a whole year.").min(0).max(3000).nullable(),
    rating: z
      .number()
      .min(0, "The rating starts at 0.")
      .max(10, "The rating ends at 10.")
      .multipleOf(0.5, "Use steps of 0.5.")
      .nullable(),
    verdict: z.string().trim().max(600, "Keep the verdict under 600 characters."),
  })
  .nullable();

export const postSchema = z
  .object({
    title,
    slug,
    excerpt: longText,
    cover_url: optionalUrl,
    cover_alt: shortText,
    category_id: optionalId,
    tags: tagList,
    content_md: markdown,
    review,
    featured: z.boolean(),
    status,
    published_at: timestamp,
  })
  .superRefine(withCoverAlt);

export type PostInput = z.input<typeof postSchema>;

/* --------------------------------------------------------------- projects -- */

const galleryImage = z.object({
  url: z.string().trim().refine(isHttpUrl, "This image has no valid URL."),
  alt: z.string().trim().min(1, "Describe the image for people who cannot see it.").max(400),
  caption: z.string().trim().max(400),
});

export const projectSchema = z
  .object({
    title,
    slug,
    summary: longText,
    cover_url: optionalUrl,
    cover_alt: shortText,
    category_id: optionalId,
    role: shortText,
    tech: tagList,
    started_on: dateOnly,
    ended_on: dateOnly,
    is_ongoing: z.boolean(),
    repo_url: optionalUrl,
    live_url: optionalUrl,
    gallery: z.array(galleryImage).max(60, "That is too many images."),
    content_md: markdown,
    featured: z.boolean(),
    position,
    status,
    published_at: timestamp,
  })
  .superRefine(withCoverAlt)
  .superRefine((value, ctx) => {
    if (value.started_on && value.ended_on && value.ended_on < value.started_on) {
      ctx.addIssue({ code: "custom", path: ["ended_on"], message: "The end date is before the start date." });
    }
  });

export type ProjectInput = z.input<typeof projectSchema>;

/* ---------------------------------------------------------------- courses -- */

const courseLink = z.object({
  linked_course_id: z.uuid("Pick a course."),
  relation: z.enum(COURSE_RELATIONS),
});

export const courseSchema = z
  .object({
    title,
    slug,
    summary: longText,
    description_md: markdown,
    cover_url: optionalUrl,
    cover_alt: shortText,
    level: z.enum(COURSE_LEVELS),
    topics: tagList,
    featured: z.boolean(),
    position,
    status,
    published_at: timestamp,
    links: z.array(courseLink).max(40, "That is too many links."),
  })
  .superRefine(withCoverAlt)
  .superRefine((value, ctx) => {
    const seen = new Set<string>();
    value.links.forEach((link, index) => {
      const key = `${link.linked_course_id}:${link.relation}`;
      if (seen.has(key)) {
        ctx.addIssue({ code: "custom", path: ["links", index, "linked_course_id"], message: "This link is listed twice." });
      }
      seen.add(key);
    });
  });

export type CourseInput = z.input<typeof courseSchema>;

export const lessonSchema = z.object({
  title,
  slug,
  summary: longText,
  section_title: shortText,
  video_url: optionalUrl,
  content_md: markdown,
  status,
  published_at: timestamp,
});

export type LessonInput = z.input<typeof lessonSchema>;

/* ---------------------------------------------------------------- stories -- */

export const storySchema = z
  .object({
    title,
    slug,
    synopsis: longText,
    cover_url: optionalUrl,
    cover_alt: shortText,
    format: z.enum(STORY_FORMATS),
    genre: shortText,
    is_complete: z.boolean(),
    featured: z.boolean(),
    position,
    status,
    published_at: timestamp,
  })
  .superRefine(withCoverAlt);

export type StoryInput = z.input<typeof storySchema>;

export const chapterSchema = z.object({
  title,
  slug,
  part_title: shortText,
  content_md: markdown,
  status,
  published_at: timestamp,
});

export type ChapterInput = z.input<typeof chapterSchema>;

/* ----------------------------------------------------------- publications -- */

export const publicationSchema = z.object({
  title: z.string().trim().min(1, "A title is required.").max(500, "Keep the title under 500 characters."),
  slug,
  authors: tagList,
  kind: z.enum(PUBLICATION_KINDS),
  venue: shortText,
  year: z
    .union([z.number(), z.null()])
    .transform((value, ctx) => {
      if (value === null || Number.isNaN(value)) {
        ctx.addIssue({ code: "custom", message: "A year is required." });
        return z.NEVER;
      }
      return value;
    })
    .pipe(z.number().int("Use a whole year.").min(1900, "Use a year after 1900.").max(2200, "Use a realistic year.")),
  published_on: dateOnly,
  abstract: z.string().trim().max(12000, "Keep the abstract under 12000 characters."),
  keywords: tagList,
  pdf_url: optionalUrl,
  doi: z
    .string()
    .trim()
    .max(200)
    .transform((value) => (value === "" ? null : value)),
  url: optionalUrl,
  bibtex: z.string().max(12000, "Keep the BibTeX entry under 12000 characters."),
  featured: z.boolean(),
  status,
  published_at: timestamp,
});

export type PublicationInput = z.input<typeof publicationSchema>;

/* -------------------------------------------------------------- galleries -- */

export const gallerySchema = z.object({
  title,
  slug,
  description: longText,
  cover_url: optionalUrl,
});

export type GalleryInput = z.input<typeof gallerySchema>;

export const galleryItemSchema = z.object({
  title: shortText,
  caption: longText,
  alt: shortText,
  poster_url: optionalUrl,
  made_on: dateOnly,
  meta: z
    .array(
      z.object({
        key: z.string().trim().min(1, "Name this detail.").max(60),
        value: z.string().trim().max(400),
      }),
    )
    .max(30, "That is too many details.")
    .superRefine((entries, ctx) => {
      const seen = new Set<string>();
      entries.forEach((entry, index) => {
        const key = entry.key.toLowerCase();
        if (seen.has(key)) ctx.addIssue({ code: "custom", path: [index, "key"], message: "This name is used twice." });
        seen.add(key);
      });
    }),
  tags: tagList,
  featured: z.boolean(),
  status,
});

export type GalleryItemInput = z.input<typeof galleryItemSchema>;

/** A file that was just uploaded (or picked from the library) and joins a gallery. */
export const newGalleryItemSchema = z.object({
  media_url: z.string().trim().refine(isHttpUrl, "This file has no valid URL."),
  media_type: z.enum(["image", "video"]),
  title: shortText,
  alt: shortText,
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
});

export type NewGalleryItemInput = z.input<typeof newGalleryItemSchema>;

/* ------------------------------------------------------------- experience -- */

export const experienceSchema = z
  .object({
    kind: z.enum(EXPERIENCE_KINDS),
    title,
    organization: shortText,
    location: shortText,
    url: optionalUrl,
    start_date: looseDate,
    end_date: looseDate,
    is_current: z.boolean(),
    summary: longText,
    highlights: z.array(z.string().trim().min(1).max(400)).max(30, "That is too many highlights."),
    status,
  })
  .superRefine((value, ctx) => {
    if (value.start_date && value.end_date && value.end_date < value.start_date) {
      ctx.addIssue({ code: "custom", path: ["end_date"], message: "The end date is before the start date." });
    }
  });

export type ExperienceInput = z.input<typeof experienceSchema>;

/* ------------------------------------------------------------- categories -- */

export const categorySchema = z.object({
  kind: z.enum(CATEGORY_KINDS),
  name: z.string().trim().min(1, "A name is required.").max(120),
  slug,
  description: longText,
  cover_url: optionalUrl,
});

export type CategoryInput = z.input<typeof categorySchema>;

/* ------------------------------------------------------------ backgrounds -- */

/** How much of the theme's ground lies over the picture, in percent. */
const veil = z.coerce.number().int("Use a whole number.").min(0, "0 at least.").max(95, "95 at most: the picture has to show.");

export const backgroundSchema = z.object({
  name: z.string().trim().min(1, "A name is required.").max(60, "Keep the name under 60 characters."),
  light_url: optionalUrl.refine((value) => value !== null, "Choose the picture for the light theme."),
  dark_url: optionalUrl,
  veil_light: veil,
  veil_dark: veil,
});

export type BackgroundInput = z.input<typeof backgroundSchema>;

export const backgroundSettingsSchema = z.object({
  background_id: optionalId,
  background_picker: z.boolean(),
});

export type BackgroundSettingsInput = z.input<typeof backgroundSettingsSchema>;

/* --------------------------------------------------------------- settings -- */

export const settingsSchema = z
  .object({
    full_name: shortText,
    headline: shortText,
    intro: longText,
    location: shortText,
    email: z
      .string()
      .trim()
      .max(320)
      .refine((value) => value === "" || z.email().safeParse(value).success, "Enter a valid email address."),
    avatar_url: optionalUrl,
    avatar_alt: shortText,
    resume_url: optionalUrl,
    bio_md: markdown,
    now_md: markdown,
    socials: z
      .array(
        z.object({
          label: z.string().trim().min(1, "Name this link.").max(60),
          url: z
            .string()
            .trim()
            .min(1, "A URL is required.")
            .max(2048)
            .refine(
              (value) => value === "" || isHttpUrl(value) || value.startsWith("mailto:"),
              "Enter a full URL starting with http://, https:// or mailto:",
            ),
          handle: z.string().trim().max(120),
        }),
      )
      .max(24, "That is too many links."),
    skills: z
      .array(
        z.object({
          group: z.string().trim().min(1, "Name this group.").max(80),
          items: tagList,
        }),
      )
      .max(24, "That is too many groups."),
    interests: tagList,
    site_title: shortText,
    site_description: z.string().trim().max(600, "Keep the description under 600 characters."),
    site_url: z
      .string()
      .trim()
      .max(2048)
      .refine((value) => value === "" || isHttpUrl(value), "Enter a full URL starting with http:// or https://")
      .transform((value) => value.replace(/\/+$/, "")),
    og_image_url: optionalUrl,
  })
  .superRefine((value, ctx) => {
    if (value.avatar_url && value.avatar_alt.trim() === "") {
      ctx.addIssue({ code: "custom", path: ["avatar_alt"], message: "Describe the photo for people who cannot see it." });
    }
  });

export type SettingsInput = z.input<typeof settingsSchema>;

/* ------------------------------------------------------------------ shared -- */

export const idSchema = z.uuid();
export const idListSchema = z.array(z.uuid()).max(2000);
