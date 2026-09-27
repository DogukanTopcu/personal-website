---
title: "This website"
slug: this-website
category: software-engineering
summary: "The site you are reading: a public Next.js app, a separate admin panel, and a Supabase backend."
role: "Design and development"
tech: ["Next.js", "TypeScript", "Supabase", "PostgreSQL", "Tailwind CSS", "Canvas 2D"]
started_on: 2026-09-01
is_ongoing: true
featured: true
position: 1
published_at: 2026-09-21
---
> [!NOTE]
> Sample entry. This text is placeholder content that shows how the page looks. Replace it from the admin panel.

## What it is

Two Next.js applications and one database. The public site renders everything you can read here. The admin panel is a separate project where courses, posts, projects, stories, publications and galleries are written and published. Both talk to the same Supabase project.

## How it is put together

| Part | Job |
| --- | --- |
| `web` | Public site. Server rendered, revalidated when something is published. |
| `admin` | Writing and publishing. Markdown editor with live preview and a media library. |
| `supabase` | PostgreSQL schema, row level security, storage for media. |

Visitors only ever read rows that are published and whose publish date has arrived, which is enforced in the database rather than in application code.

## The home page

The home page is a single drafting sheet. Every construction on it exists twice: once as a blue pencil underdrawing and once as an ink pass. Scrolling moves a camera across the sheet, the blue arrives first, and the ink follows. At the end the camera pulls back and the whole sheet is visible at once.

Without JavaScript, or when reduced motion is requested, the same content is served as an ordinary page with every drawing already inked.

## Writing format

Content is written in Markdown with a few additions: math, code with titles and highlighted lines, callouts, collapsible blocks, and media files that turn into players.

```ts title="reading-time.ts"
export function readingMinutes(markdown: string): number {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}
```
