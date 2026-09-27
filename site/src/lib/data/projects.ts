import { cache } from "react";
import { readDb } from "@/lib/supabase/server";
import type { GalleryShot, Project, ProjectCard } from "./types";
import { asArray, isObject, nowIso, reportDataError } from "./util";

const CARD =
  "id, slug, title, summary, cover_url, cover_alt, category_id, role, tech, started_on, ended_on, is_ongoing, repo_url, live_url, gallery, reading_minutes, featured, position, status, published_at, created_at, updated_at, category:categories(*)";

const isShot = (v: unknown): v is GalleryShot => isObject(v) && typeof v.url === "string";

export const listProjects = cache(async (opts: { featured?: boolean; featuredFirst?: boolean; limit?: number } = {}): Promise<ProjectCard[]> => {
  const { db, preview } = await readDb();
  if (!db) return [];
  let query = db.from("projects").select(CARD);
  query = preview ? query.neq("status", "archived") : query.eq("status", "published").lte("published_at", nowIso());
  if (opts.featured) query = query.eq("featured", true);
  if (opts.featuredFirst) query = query.order("featured", { ascending: false });
  query = query.order("position", { ascending: true }).order("published_at", { ascending: false, nullsFirst: true });
  if (opts.limit) query = query.limit(opts.limit);
  const { data, error } = await query;
  reportDataError("projects", error);
  return (data ?? []).map((row) => ({ ...row, gallery: asArray(row.gallery, isShot) })) as unknown as ProjectCard[];
});

export const getProject = cache(async (slug: string): Promise<Project | null> => {
  const { db, preview } = await readDb();
  if (!db) return null;
  let query = db.from("projects").select("*, category:categories(*)").eq("slug", slug);
  if (!preview) query = query.eq("status", "published").lte("published_at", nowIso());
  const { data, error } = await query.maybeSingle();
  reportDataError(`project:${slug}`, error);
  if (!data) return null;
  return { ...data, gallery: asArray(data.gallery, isShot) } as unknown as Project;
});
