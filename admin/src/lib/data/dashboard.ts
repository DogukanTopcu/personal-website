import { CONTENT_STATUSES, type ContentStatus } from "@/lib/types";
import type { DB } from "./shared";

export type ContentKind = "post" | "project" | "course" | "lesson" | "story" | "chapter" | "publication";

export const KIND_LABELS: Record<ContentKind, string> = {
  post: "Post",
  project: "Project",
  course: "Course",
  lesson: "Lesson",
  story: "Story",
  chapter: "Chapter",
  publication: "Publication",
};

export type ActivityItem = {
  kind: ContentKind;
  id: string;
  title: string;
  status: ContentStatus;
  published_at: string | null;
  updated_at: string;
  href: string;
};

export type TypeCount = {
  key: string;
  label: string;
  href: string;
  published: number;
  draft: number;
  /** Lessons under courses, chapters under stories. */
  detail?: string;
};

const ACTIVITY_LIMIT = 8;
const PER_TABLE = 6;

type BaseRow = { id: string; title: string; status: ContentStatus; published_at: string | null; updated_at: string };

function toActivity<T extends BaseRow>(kind: ContentKind, rows: T[] | null, href: (row: T) => string): ActivityItem[] {
  return (rows ?? []).map((row) => ({
    kind,
    id: row.id,
    title: row.title,
    status: row.status,
    published_at: row.published_at,
    updated_at: row.updated_at,
    href: href(row),
  }));
}

function newestFirst(items: ActivityItem[]): ActivityItem[] {
  return items.sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, ACTIVITY_LIMIT);
}

const BASE = "id, title, status, published_at, updated_at" as const;
const LESSON = "id, title, status, published_at, updated_at, course_id" as const;
const CHAPTER = "id, title, status, published_at, updated_at, story_id" as const;

/** The newest rows of every content table, optionally drafts only, merged into one list. */
async function loadActivity(db: DB, draftsOnly: boolean): Promise<ActivityItem[]> {
  const statuses: ContentStatus[] = draftsOnly ? ["draft"] : CONTENT_STATUSES;
  const latest = { ascending: false } as const;

  const [posts, projects, courses, lessons, stories, chapters, publications] = await Promise.all([
    db.from("posts").select(BASE).in("status", statuses).order("updated_at", latest).limit(PER_TABLE),
    db.from("projects").select(BASE).in("status", statuses).order("updated_at", latest).limit(PER_TABLE),
    db.from("courses").select(BASE).in("status", statuses).order("updated_at", latest).limit(PER_TABLE),
    db.from("lessons").select(LESSON).in("status", statuses).order("updated_at", latest).limit(PER_TABLE),
    db.from("stories").select(BASE).in("status", statuses).order("updated_at", latest).limit(PER_TABLE),
    db.from("chapters").select(CHAPTER).in("status", statuses).order("updated_at", latest).limit(PER_TABLE),
    db.from("publications").select(BASE).in("status", statuses).order("updated_at", latest).limit(PER_TABLE),
  ]);

  return newestFirst([
    ...toActivity("post", posts.data, (row) => `/posts/${row.id}`),
    ...toActivity("project", projects.data, (row) => `/projects/${row.id}`),
    ...toActivity("course", courses.data, (row) => `/courses/${row.id}`),
    ...toActivity("lesson", lessons.data, (row) => `/courses/${row.course_id}/lessons/${row.id}`),
    ...toActivity("story", stories.data, (row) => `/stories/${row.id}`),
    ...toActivity("chapter", chapters.data, (row) => `/stories/${row.story_id}/chapters/${row.id}`),
    ...toActivity("publication", publications.data, (row) => `/publications/${row.id}`),
  ]);
}

async function loadCounts(db: DB): Promise<TypeCount[]> {
  const head = { count: "exact", head: true } as const;
  const count = (result: { count: number | null }) => result.count ?? 0;

  const [
    postsPublished,
    postsDraft,
    projectsPublished,
    projectsDraft,
    coursesPublished,
    coursesDraft,
    storiesPublished,
    storiesDraft,
    publicationsPublished,
    publicationsDraft,
    itemsPublished,
    itemsDraft,
    lessons,
    chapters,
  ] = await Promise.all([
    db.from("posts").select("id", head).eq("status", "published"),
    db.from("posts").select("id", head).eq("status", "draft"),
    db.from("projects").select("id", head).eq("status", "published"),
    db.from("projects").select("id", head).eq("status", "draft"),
    db.from("courses").select("id", head).eq("status", "published"),
    db.from("courses").select("id", head).eq("status", "draft"),
    db.from("stories").select("id", head).eq("status", "published"),
    db.from("stories").select("id", head).eq("status", "draft"),
    db.from("publications").select("id", head).eq("status", "published"),
    db.from("publications").select("id", head).eq("status", "draft"),
    db.from("gallery_items").select("id", head).eq("status", "published"),
    db.from("gallery_items").select("id", head).eq("status", "draft"),
    db.from("lessons").select("id", head),
    db.from("chapters").select("id", head),
  ]);

  const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

  return [
    { key: "posts", label: "Posts", href: "/posts", published: count(postsPublished), draft: count(postsDraft) },
    {
      key: "projects",
      label: "Projects",
      href: "/projects",
      published: count(projectsPublished),
      draft: count(projectsDraft),
    },
    {
      key: "courses",
      label: "Courses",
      href: "/courses",
      published: count(coursesPublished),
      draft: count(coursesDraft),
      detail: plural(count(lessons), "lesson", "lessons"),
    },
    {
      key: "stories",
      label: "Stories",
      href: "/stories",
      published: count(storiesPublished),
      draft: count(storiesDraft),
      detail: plural(count(chapters), "chapter", "chapters"),
    },
    {
      key: "publications",
      label: "Publications",
      href: "/publications",
      published: count(publicationsPublished),
      draft: count(publicationsDraft),
    },
    {
      key: "galleries",
      label: "Gallery items",
      href: "/galleries",
      published: count(itemsPublished),
      draft: count(itemsDraft),
    },
  ];
}

export async function getDashboard(db: DB) {
  const [counts, drafts, recent] = await Promise.all([loadCounts(db), loadActivity(db, true), loadActivity(db, false)]);
  return { counts, drafts, recent };
}
