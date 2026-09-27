import type { Tables } from "@/lib/supabase/database.types";

export type Settings = Omit<Tables<"site_settings">, "socials" | "skills" | "home_copy"> & {
  socials: Social[];
  skills: SkillGroup[];
  home_copy: Record<string, { heading?: string; body?: string }>;
};
export type Social = { label: string; url: string; handle?: string };
export type SkillGroup = { group: string; items: string[] };

export type Category = Tables<"categories">;
export type Experience = Tables<"experiences">;

export type Review = { subject?: string; creator?: string; year?: number; rating?: number; verdict?: string };
export type Post = Omit<Tables<"posts">, "review" | "search"> & { review: Review | null; category: Category | null };
export type PostCard = Omit<Post, "content_md">;

export type GalleryShot = { url: string; alt?: string; caption?: string };
export type Project = Omit<Tables<"projects">, "gallery" | "search"> & { gallery: GalleryShot[]; category: Category | null };
export type ProjectCard = Omit<Project, "content_md">;

export type Course = Omit<Tables<"courses">, "search">;
export type LessonCard = Omit<Tables<"lessons">, "content_md" | "search">;
export type Lesson = Omit<Tables<"lessons">, "search">;
export type CourseLink = { relation: "prerequisite" | "next" | "related"; course: Pick<Course, "slug" | "title" | "summary" | "level"> };

export type Story = Omit<Tables<"stories">, "search">;
export type ChapterCard = Omit<Tables<"chapters">, "content_md">;
export type Chapter = Tables<"chapters">;

export type Publication = Omit<Tables<"publications">, "search">;

export type Gallery = Tables<"galleries">;
export type GalleryItem = Omit<Tables<"gallery_items">, "meta"> & { meta: Record<string, string> };
