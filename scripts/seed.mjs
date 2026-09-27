#!/usr/bin/env node
/**
 * Seeds Supabase from the files in supabase/seed/.
 *
 *   node scripts/seed.mjs
 *   node scripts/seed.mjs --only backgrounds        # one or more sections, comma separated
 *
 * Idempotent: rows are matched by slug (or title + organization for
 * experiences, name for backgrounds) and updated in place, so it is safe to
 * run again. It never deletes anything, but it does write the fields its files
 * set over whatever the admin panel changed in those same rows, which is what
 * --only is for once the site is in use. Works against local or cloud Supabase, whichever
 * SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in ./.env.local point at.
 */
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import matter from "gray-matter";
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.join(root, ".env.local"), quiet: true });

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Put them in .env.local at the repo root.");
  process.exit(1);
}

const SECTIONS = ["settings", "experiences", "categories", "posts", "projects", "courses", "stories", "publications", "gallery", "backgrounds"];
const onlyAt = process.argv.indexOf("--only");
const only = onlyAt === -1 ? null : new Set((process.argv[onlyAt + 1] ?? "").split(",").map((name) => name.trim()).filter(Boolean));
const unknown = only ? [...only].filter((name) => !SECTIONS.includes(name)) : [];
if (only && (only.size === 0 || unknown.length > 0)) {
  console.error(`--only takes a comma separated list of: ${SECTIONS.join(", ")}.`);
  process.exit(1);
}
const want = (section) => !only || only.has(section);

const db = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const seedDir = path.join(root, "supabase", "seed");

const exists = async (p) => stat(p).then(() => true, () => false);
const readJson = async (file, fallback) =>
  (await exists(path.join(seedDir, file))) ? JSON.parse(await readFile(path.join(seedDir, file), "utf8")) : fallback;

async function readMarkdownDir(dir) {
  const full = path.join(seedDir, dir);
  if (!(await exists(full))) return [];
  const names = (await readdir(full)).filter((n) => n.endsWith(".md")).sort();
  return Promise.all(
    names.map(async (name) => {
      const parsed = matter(await readFile(path.join(full, name), "utf8"));
      return { name, data: parsed.data, body: parsed.content.trim() };
    }),
  );
}

async function subdirs(dir) {
  const full = path.join(seedDir, dir);
  if (!(await exists(full))) return [];
  const names = await readdir(full, { withFileTypes: true });
  return names.filter((d) => d.isDirectory()).map((d) => d.name).sort();
}

function check(label, { error }) {
  if (error) {
    console.error(`  x ${label}: ${error.message}`);
    process.exitCode = 1;
    return false;
  }
  return true;
}

const iso = (value) => (value ? new Date(value).toISOString() : new Date().toISOString());
const dateOnly = (value) => (value ? new Date(value).toISOString().slice(0, 10) : null);

async function categoryIds(kind) {
  const { data, error } = await db.from("categories").select("id, slug").eq("kind", kind);
  if (error) throw error;
  return Object.fromEntries(data.map((c) => [c.slug, c.id]));
}

// ------------------------------------------------------------- settings --
const settings = want("settings") ? await readJson("settings.json", null) : null;
if (settings) {
  const ok = check("site_settings", await db.from("site_settings").upsert({ id: 1, ...settings }));
  if (ok) console.log("site settings");
}

// ---------------------------------------------------------- experiences --
for (const [index, exp] of (want("experiences") ? await readJson("experiences.json", []) : []).entries()) {
  const row = { position: index, status: "published", ...exp };
  const { data: found } = await db
    .from("experiences")
    .select("id")
    .eq("title", row.title)
    .eq("organization", row.organization ?? "")
    .maybeSingle();
  const result = found
    ? await db.from("experiences").update(row).eq("id", found.id)
    : await db.from("experiences").insert(row);
  if (check(`experience ${row.title}`, result)) console.log(`experience  ${row.title}, ${row.organization}`);
}

// ----------------------------------------------------------- categories --
for (const cat of want("categories") ? await readJson("category-covers.json", []) : []) {
  const result = await db.from("categories").update({ cover_url: cat.cover_url }).eq("kind", cat.kind).eq("slug", cat.slug);
  if (check(`category cover ${cat.slug}`, result)) console.log(`category    ${cat.kind}/${cat.slug} cover`);
}

// ---------------------------------------------------------------- posts --
const postCategories = await categoryIds("post");
for (const file of want("posts") ? await readMarkdownDir("posts") : []) {
  const d = file.data;
  const row = {
    slug: d.slug,
    title: d.title,
    excerpt: d.excerpt ?? "",
    cover_url: d.cover_url ?? null,
    cover_alt: d.cover_alt ?? "",
    category_id: postCategories[d.category] ?? null,
    tags: d.tags ?? [],
    review: d.review ?? null,
    featured: Boolean(d.featured),
    content_md: file.body,
    status: d.status ?? "published",
    published_at: iso(d.published_at),
  };
  if (check(`post ${row.slug}`, await db.from("posts").upsert(row, { onConflict: "slug" }))) console.log(`post        ${row.slug}`);
}

// ------------------------------------------------------------- projects --
const projectCategories = await categoryIds("project");
for (const file of want("projects") ? await readMarkdownDir("projects") : []) {
  const d = file.data;
  const row = {
    slug: d.slug,
    title: d.title,
    summary: d.summary ?? "",
    cover_url: d.cover_url ?? null,
    cover_alt: d.cover_alt ?? "",
    category_id: projectCategories[d.category] ?? null,
    role: d.role ?? "",
    tech: d.tech ?? [],
    started_on: dateOnly(d.started_on),
    ended_on: dateOnly(d.ended_on),
    is_ongoing: Boolean(d.is_ongoing),
    repo_url: d.repo_url ?? null,
    live_url: d.live_url ?? null,
    gallery: d.gallery ?? [],
    featured: Boolean(d.featured),
    position: d.position ?? 0,
    content_md: file.body,
    status: d.status ?? "published",
    published_at: iso(d.published_at),
  };
  if (check(`project ${row.slug}`, await db.from("projects").upsert(row, { onConflict: "slug" }))) console.log(`project     ${row.slug}`);
}

// -------------------------------------------------------------- courses --
const pendingLinks = [];
for (const dir of want("courses") ? await subdirs("courses") : []) {
  const files = await readMarkdownDir(path.join("courses", dir));
  const courseFile = files.find((f) => f.name === "course.md");
  if (!courseFile) continue;
  const d = courseFile.data;
  const courseRow = {
    slug: d.slug,
    title: d.title,
    summary: d.summary ?? "",
    description_md: courseFile.body,
    cover_url: d.cover_url ?? null,
    cover_alt: d.cover_alt ?? "",
    level: d.level ?? "beginner",
    topics: d.topics ?? [],
    featured: Boolean(d.featured),
    position: d.position ?? 0,
    status: d.status ?? "published",
    published_at: iso(d.published_at),
  };
  const { data: course, error } = await db.from("courses").upsert(courseRow, { onConflict: "slug" }).select("id").single();
  if (!check(`course ${courseRow.slug}`, { error })) continue;
  console.log(`course      ${courseRow.slug}`);
  for (const link of d.links ?? []) pendingLinks.push({ from: course.id, to: link.course, relation: link.relation });

  const lessons = files.filter((f) => f.name !== "course.md");
  for (const [index, lesson] of lessons.entries()) {
    const l = lesson.data;
    const row = {
      course_id: course.id,
      slug: l.slug,
      title: l.title,
      summary: l.summary ?? "",
      section_title: l.section_title ?? "",
      video_url: l.video_url ?? null,
      position: index,
      content_md: lesson.body,
      status: l.status ?? "published",
      published_at: iso(l.published_at ?? d.published_at),
    };
    if (check(`lesson ${row.slug}`, await db.from("lessons").upsert(row, { onConflict: "course_id,slug" })))
      console.log(`  lesson    ${row.slug}`);
  }
}

for (const link of pendingLinks) {
  const { data: target } = await db.from("courses").select("id").eq("slug", link.to).maybeSingle();
  if (!target) continue;
  check(
    `course link ${link.to}`,
    await db
      .from("course_links")
      .upsert({ course_id: link.from, linked_course_id: target.id, relation: link.relation }, { onConflict: "course_id,linked_course_id,relation" }),
  );
}

// -------------------------------------------------------------- stories --
for (const dir of want("stories") ? await subdirs("stories") : []) {
  const files = await readMarkdownDir(path.join("stories", dir));
  const storyFile = files.find((f) => f.name === "story.md");
  if (!storyFile) continue;
  const d = storyFile.data;
  const storyRow = {
    slug: d.slug,
    title: d.title,
    synopsis: d.synopsis ?? "",
    cover_url: d.cover_url ?? null,
    cover_alt: d.cover_alt ?? "",
    format: d.format ?? "short-story",
    genre: d.genre ?? "",
    is_complete: Boolean(d.is_complete),
    featured: Boolean(d.featured),
    position: d.position ?? 0,
    status: d.status ?? "published",
    published_at: iso(d.published_at),
  };
  const { data: story, error } = await db.from("stories").upsert(storyRow, { onConflict: "slug" }).select("id").single();
  if (!check(`story ${storyRow.slug}`, { error })) continue;
  console.log(`story       ${storyRow.slug}`);

  const chapters = files.filter((f) => f.name !== "story.md");
  for (const [index, chapter] of chapters.entries()) {
    const c = chapter.data;
    const row = {
      story_id: story.id,
      slug: c.slug,
      title: c.title,
      part_title: c.part_title ?? "",
      position: index,
      content_md: chapter.body,
      status: c.status ?? "published",
      published_at: iso(c.published_at ?? d.published_at),
    };
    if (check(`chapter ${row.slug}`, await db.from("chapters").upsert(row, { onConflict: "story_id,slug" })))
      console.log(`  chapter   ${row.slug}`);
  }
}

// --------------------------------------------------------- publications --
for (const pub of want("publications") ? await readJson("publications.json", []) : []) {
  const row = { status: "published", ...pub, published_at: iso(pub.published_at) };
  if (check(`publication ${row.slug}`, await db.from("publications").upsert(row, { onConflict: "slug" })))
    console.log(`publication ${row.slug}`);
}

// -------------------------------------------------------- gallery items --
const { data: galleries } = await db.from("galleries").select("id, slug");
const galleryBySlug = Object.fromEntries((galleries ?? []).map((g) => [g.slug, g.id]));
for (const item of want("gallery") ? await readJson("gallery-items.json", []) : []) {
  const galleryId = galleryBySlug[item.gallery];
  if (!galleryId) continue;
  const { gallery: _gallery, ...rest } = item;
  const { data: found } = await db.from("gallery_items").select("id").eq("media_url", rest.media_url).maybeSingle();
  const row = { gallery_id: galleryId, status: "published", published_at: iso(rest.published_at), ...rest };
  const result = found ? await db.from("gallery_items").update(row).eq("id", found.id) : await db.from("gallery_items").insert(row);
  if (check(`gallery item ${rest.title}`, result)) console.log(`gallery     ${item.gallery}: ${rest.title || rest.media_url}`);
}

// ---------------------------------------------------------- backgrounds --
// Pictures in supabase/seed/backgrounds/, listed in backgrounds.json. Each is
// uploaded to the media bucket under backgrounds/ and recorded in the media
// library, then one row per option is written, matched by name. The veils were
// set so the faintest text keeps 4.5:1 contrast over the busiest part of each
// picture. Which option the site shows is left to the admin panel.
async function uploadBackground(entry, alt) {
  const storagePath = `backgrounds/${entry.file}`;
  const body = await readFile(path.join(seedDir, "backgrounds", entry.file));
  const uploaded = await db.storage.from("media").upload(storagePath, body, { contentType: "image/webp", upsert: true });
  if (!check(`upload ${storagePath}`, uploaded)) return null;
  const publicUrl = db.storage.from("media").getPublicUrl(storagePath).data.publicUrl;
  const asset = { path: storagePath, url: publicUrl, mime_type: "image/webp", size_bytes: body.length, width: entry.width, height: entry.height, alt };
  check(`media ${storagePath}`, await db.from("media_assets").upsert(asset, { onConflict: "path" }));
  return publicUrl;
}

const backgrounds = want("backgrounds") ? await readJson("backgrounds.json", []) : [];
for (const [position, bg] of backgrounds.entries()) {
  const lightUrl = await uploadBackground(bg.light, `${bg.name} background, light theme`);
  const darkUrl = bg.dark ? await uploadBackground(bg.dark, `${bg.name} background, dark theme`) : null;
  if (!lightUrl) continue;
  const row = { name: bg.name, light_url: lightUrl, dark_url: darkUrl, veil_light: bg.veil_light, veil_dark: bg.veil_dark, position };
  if (check(`background ${bg.name}`, await db.from("backgrounds").upsert(row, { onConflict: "name" }))) console.log(`background  ${bg.name}`);
}

console.log(process.exitCode ? "\nFinished with errors." : "\nSeed complete.");
