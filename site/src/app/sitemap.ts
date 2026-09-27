import type { MetadataRoute } from "next";
import { listCourses } from "@/lib/data/courses";
import { listGalleries } from "@/lib/data/gallery";
import { listPosts } from "@/lib/data/posts";
import { listProjects } from "@/lib/data/projects";
import { listPublications } from "@/lib/data/publications";
import { getSettings } from "@/lib/data/settings";
import { listStories } from "@/lib/data/stories";
import { siteUrl } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const settings = await getSettings();
  const base = siteUrl(settings.site_url);
  const [posts, projects, courses, stories, publications, galleries] = await Promise.all([
    listPosts(),
    listProjects(),
    listCourses(),
    listStories(),
    listPublications(),
    listGalleries(),
  ]);

  const at = (path: string, lastModified?: string | null, priority = 0.6) => ({
    url: `${base}${path}`,
    lastModified: lastModified ? new Date(lastModified) : undefined,
    priority,
  });

  return [
    at("/", undefined, 1),
    at("/about", settings.updated_at, 0.8),
    at("/projects", undefined, 0.8),
    at("/blog", undefined, 0.8),
    at("/courses", undefined, 0.8),
    at("/stories", undefined, 0.7),
    at("/research", undefined, 0.7),
    at("/gallery", undefined, 0.7),
    ...projects.map((p) => at(`/projects/${p.slug}`, p.updated_at, 0.7)),
    ...posts.map((p) => at(`/blog/${p.slug}`, p.updated_at, 0.7)),
    ...courses.flatMap((c) => [
      at(`/courses/${c.slug}`, c.updated_at, 0.7),
      ...c.lessons.map((l) => at(`/courses/${c.slug}/${l.slug}`, l.updated_at, 0.6)),
    ]),
    ...stories.flatMap((s) => [
      at(`/stories/${s.slug}`, s.updated_at, 0.6),
      ...s.chapters.map((ch) => at(`/stories/${s.slug}/${ch.slug}`, ch.updated_at, 0.5)),
    ]),
    ...publications.map((p) => at(`/research#${p.slug}`, p.updated_at, 0.5)),
    ...galleries.map((g) => at(`/gallery/${g.slug}`, g.updated_at, 0.6)),
  ];
}
