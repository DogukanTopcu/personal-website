/**
 * Turns database rows into form values, and provides the defaults for new
 * rows. Plain functions, callable from Server Components.
 */
import type { ChapterRecord } from "@/lib/data/chapters";
import type { CourseRecord } from "@/lib/data/courses";
import type { ExperienceRow } from "@/lib/data/experiences";
import type { GalleryItemRow, GalleryRecord } from "@/lib/data/galleries";
import type { LessonRecord } from "@/lib/data/lessons";
import type { PostRecord } from "@/lib/data/posts";
import type { ProjectRecord } from "@/lib/data/projects";
import type { PublicationRecord } from "@/lib/data/publications";
import type { SettingsRecord } from "@/lib/data/settings";
import type { StoryRecord } from "@/lib/data/stories";
import { dateToLooseInput } from "@/lib/format";
import type {
  ChapterInput,
  CourseInput,
  ExperienceInput,
  GalleryInput,
  GalleryItemInput,
  LessonInput,
  PostInput,
  ProjectInput,
  PublicationInput,
  SettingsInput,
  StoryInput,
} from "@/lib/schemas";
import {
  parseGalleryImages,
  parseMeta,
  parseReview,
  parseSkills,
  parseSocials,
  type CourseLevel,
  type CourseRelation,
  type ExperienceKind,
  type PublicationKind,
  type StoryFormat,
} from "@/lib/types";

export const POST_DEFAULTS: PostInput = {
  title: "",
  slug: "",
  excerpt: "",
  cover_url: null,
  cover_alt: "",
  category_id: null,
  tags: [],
  content_md: "",
  review: null,
  featured: false,
  status: "draft",
  published_at: null,
};

export function toPostInput(post: PostRecord): PostInput {
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    cover_url: post.cover_url,
    cover_alt: post.cover_alt,
    category_id: post.category_id,
    tags: post.tags,
    content_md: post.content_md,
    review: parseReview(post.review),
    featured: post.featured,
    status: post.status,
    published_at: post.published_at,
  };
}

export const PROJECT_DEFAULTS: ProjectInput = {
  title: "",
  slug: "",
  summary: "",
  cover_url: null,
  cover_alt: "",
  category_id: null,
  role: "",
  tech: [],
  started_on: null,
  ended_on: null,
  is_ongoing: false,
  repo_url: null,
  live_url: null,
  gallery: [],
  content_md: "",
  featured: false,
  position: 0,
  status: "draft",
  published_at: null,
};

export function toProjectInput(project: ProjectRecord): ProjectInput {
  return {
    title: project.title,
    slug: project.slug,
    summary: project.summary,
    cover_url: project.cover_url,
    cover_alt: project.cover_alt,
    category_id: project.category_id,
    role: project.role,
    tech: project.tech,
    started_on: project.started_on,
    ended_on: project.ended_on,
    is_ongoing: project.is_ongoing,
    repo_url: project.repo_url,
    live_url: project.live_url,
    gallery: parseGalleryImages(project.gallery),
    content_md: project.content_md,
    featured: project.featured,
    position: project.position,
    status: project.status,
    published_at: project.published_at,
  };
}

export const COURSE_DEFAULTS: CourseInput = {
  title: "",
  slug: "",
  summary: "",
  description_md: "",
  cover_url: null,
  cover_alt: "",
  level: "beginner",
  topics: [],
  featured: false,
  position: 0,
  status: "draft",
  published_at: null,
  links: [],
};

export function toCourseInput(
  course: CourseRecord,
  links: Array<{ linked_course_id: string; relation: CourseRelation }>,
): CourseInput {
  return {
    title: course.title,
    slug: course.slug,
    summary: course.summary,
    description_md: course.description_md,
    cover_url: course.cover_url,
    cover_alt: course.cover_alt,
    level: course.level as CourseLevel,
    topics: course.topics,
    featured: course.featured,
    position: course.position,
    status: course.status,
    published_at: course.published_at,
    links,
  };
}

export const LESSON_DEFAULTS: LessonInput = {
  title: "",
  slug: "",
  summary: "",
  section_title: "",
  video_url: null,
  content_md: "",
  status: "draft",
  published_at: null,
};

export function toLessonInput(lesson: LessonRecord): LessonInput {
  return {
    title: lesson.title,
    slug: lesson.slug,
    summary: lesson.summary,
    section_title: lesson.section_title,
    video_url: lesson.video_url,
    content_md: lesson.content_md,
    status: lesson.status,
    published_at: lesson.published_at,
  };
}

export const STORY_DEFAULTS: StoryInput = {
  title: "",
  slug: "",
  synopsis: "",
  cover_url: null,
  cover_alt: "",
  format: "short-story",
  genre: "",
  is_complete: false,
  featured: false,
  position: 0,
  status: "draft",
  published_at: null,
};

export function toStoryInput(story: StoryRecord): StoryInput {
  return {
    title: story.title,
    slug: story.slug,
    synopsis: story.synopsis,
    cover_url: story.cover_url,
    cover_alt: story.cover_alt,
    format: story.format as StoryFormat,
    genre: story.genre,
    is_complete: story.is_complete,
    featured: story.featured,
    position: story.position,
    status: story.status,
    published_at: story.published_at,
  };
}

export const CHAPTER_DEFAULTS: ChapterInput = {
  title: "",
  slug: "",
  part_title: "",
  content_md: "",
  status: "draft",
  published_at: null,
};

export function toChapterInput(chapter: ChapterRecord): ChapterInput {
  return {
    title: chapter.title,
    slug: chapter.slug,
    part_title: chapter.part_title,
    content_md: chapter.content_md,
    status: chapter.status,
    published_at: chapter.published_at,
  };
}

export const PUBLICATION_DEFAULTS: PublicationInput = {
  title: "",
  slug: "",
  authors: [],
  kind: "preprint",
  venue: "",
  year: null,
  published_on: null,
  abstract: "",
  keywords: [],
  pdf_url: null,
  doi: "",
  url: null,
  bibtex: "",
  featured: false,
  status: "draft",
  published_at: null,
};

export function toPublicationInput(publication: PublicationRecord): PublicationInput {
  return {
    title: publication.title,
    slug: publication.slug,
    authors: publication.authors,
    kind: publication.kind as PublicationKind,
    venue: publication.venue,
    year: publication.year,
    published_on: publication.published_on,
    abstract: publication.abstract,
    keywords: publication.keywords,
    pdf_url: publication.pdf_url,
    doi: publication.doi ?? "",
    url: publication.url,
    bibtex: publication.bibtex,
    featured: publication.featured,
    status: publication.status,
    published_at: publication.published_at,
  };
}

export const GALLERY_DEFAULTS: GalleryInput = { title: "", slug: "", description: "", cover_url: null };

export function toGalleryInput(gallery: GalleryRecord): GalleryInput {
  return { title: gallery.title, slug: gallery.slug, description: gallery.description, cover_url: gallery.cover_url };
}

export function toGalleryItemInput(item: GalleryItemRow): GalleryItemInput {
  return {
    title: item.title,
    caption: item.caption,
    alt: item.alt,
    poster_url: item.poster_url,
    made_on: item.made_on,
    meta: parseMeta(item.meta),
    tags: item.tags,
    featured: item.featured,
    status: item.status,
  };
}

export function experienceDefaults(kind: ExperienceKind): ExperienceInput {
  return {
    kind,
    title: "",
    organization: "",
    location: "",
    url: null,
    start_date: "",
    end_date: "",
    is_current: false,
    summary: "",
    highlights: [],
    status: "published",
  };
}

export function toExperienceInput(row: ExperienceRow): ExperienceInput {
  return {
    kind: row.kind as ExperienceKind,
    title: row.title,
    organization: row.organization,
    location: row.location,
    url: row.url,
    start_date: dateToLooseInput(row.start_date),
    end_date: dateToLooseInput(row.end_date),
    is_current: row.is_current,
    summary: row.summary,
    highlights: row.highlights,
    status: row.status,
  };
}

export function toSettingsInput(settings: SettingsRecord): SettingsInput {
  return {
    full_name: settings.full_name,
    headline: settings.headline,
    intro: settings.intro,
    location: settings.location,
    email: settings.email,
    avatar_url: settings.avatar_url,
    avatar_alt: settings.avatar_alt,
    resume_url: settings.resume_url,
    bio_md: settings.bio_md,
    now_md: settings.now_md,
    socials: parseSocials(settings.socials),
    skills: parseSkills(settings.skills),
    interests: settings.interests,
    site_title: settings.site_title,
    site_description: settings.site_description,
    site_url: settings.site_url,
    og_image_url: settings.og_image_url,
  };
}
