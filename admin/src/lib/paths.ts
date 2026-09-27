import { SITE_URL } from "@/lib/env";

/** Paths on the public site. Shared by "View on site", preview and revalidation. */
export const publicPaths = {
  home: "/",
  about: "/about",
  blog: "/blog",
  post: (slug: string) => `/blog/${slug}`,
  projects: "/projects",
  project: (slug: string) => `/projects/${slug}`,
  courses: "/courses",
  course: (slug: string) => `/courses/${slug}`,
  lesson: (courseSlug: string, lessonSlug: string) => `/courses/${courseSlug}/${lessonSlug}`,
  stories: "/stories",
  story: (slug: string) => `/stories/${slug}`,
  chapter: (storySlug: string, chapterSlug: string) => `/stories/${storySlug}/${chapterSlug}`,
  research: "/research",
  /** Publications have no page of their own: each is an entry on /research. */
  publication: (slug: string) => `/research#${slug}`,
  citation: (slug: string) => `/research/${slug}/citation.bib`,
  galleries: "/gallery",
  gallery: (slug: string) => `/gallery/${slug}`,
} as const;

/** Every list page. Sent with site-wide refreshes (settings) for sites that predate `all`. */
export const allListPaths: string[] = [
  publicPaths.home,
  publicPaths.about,
  publicPaths.blog,
  publicPaths.projects,
  publicPaths.courses,
  publicPaths.stories,
  publicPaths.research,
  publicPaths.galleries,
];

export function siteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** The admin route that signs a short-lived draft link and redirects to it. */
export function previewHref(path: string): string {
  return `/api/preview?path=${encodeURIComponent(path)}`;
}

/** The public path when a row is live (published and not scheduled), otherwise null. */
export function liveOrNull(status: string, publishedAt: string | null | undefined, path: string): string | null {
  if (status !== "published") return null;
  if (publishedAt && new Date(publishedAt).getTime() > Date.now()) return null;
  return path;
}
