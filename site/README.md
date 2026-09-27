# site

The public site, design **Sade**. It reads Supabase and never writes; the
admin panel in `../admin` is where content is published. See the root
`README.md` for setup, environment variables and how the two apps talk.

```bash
pnpm dev        # http://localhost:3103
pnpm build
```

## Where things are

- `src/app/(site)/page.tsx`: the home page. Every section reads the database;
  the root README lists which admin field feeds which part.
- `src/app/(site)/*`: the sections. `courses/[slug]/[lesson]` is the lesson
  page with the course and the headings in the margins.
- `src/app/globals.css`: the design tokens at the top, then chrome, page
  furniture and one block per section.
- `src/components/site/`: header, footer, frames, reveal, pager.
- `src/lib/data/`: one module per table. `src/lib/markdown/`: the writing
  dialect, shared with the admin preview.
- `src/app/api/`: `revalidate` (called by the admin after every save) and
  `draft` (signed preview links).
