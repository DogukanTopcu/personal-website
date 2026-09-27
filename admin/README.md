# Admin

The content admin for dogukantopcu.com. A separate Next.js app (App Router, React 19, Tailwind v4) that writes to the same Supabase project the public site reads from. Posts, projects, courses and lessons, stories and chapters, publications, galleries, experience, categories, the media library and the site settings are all edited here.

Everything runs as the signed-in user: there is no service role key in this app. Row level security (`public.is_admin()`) decides what a session may change, and every page and Server Action checks `is_admin()` again before touching data.

## Environment

Copy `.env.example` to `.env.local`:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API URL (local stack: `http://127.0.0.1:54321`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key. The admin never uses the service role key. |
| `NEXT_PUBLIC_SITE_URL` | Where the public site runs (`http://localhost:3100` locally). Used for "View on site", previews and cache refreshes. |
| `REVALIDATE_SECRET` | Shared with the public site. Signs revalidation calls and preview links. Server only. |

## Running

```bash
pnpm install
pnpm dev          # http://localhost:3101
pnpm build && pnpm start
pnpm typecheck && pnpm lint
```

The database schema lives in `../supabase/migrations`; run the local Supabase stack (`supabase start`) and apply it before starting the admin. Generated types are in `src/lib/supabase/database.types.ts`.

## Accounts

Sign-in is email and password only. There is no sign-up, OAuth or password reset in the UI. Create an admin with the script at the repository root:

```bash
node scripts/create-admin.mjs
```

Or create the auth user in the Supabase dashboard and then run, in the SQL editor:

```sql
select public.grant_admin('you@example.com');
```

A signed-in user who is not in `public.admins` is signed out again with the message "This account is not an admin."

## How it talks to the public site

**Revalidation.** After every successful write, the Server Action posts, from the server:

```
POST {NEXT_PUBLIC_SITE_URL}/api/revalidate
x-revalidate-secret: {REVALIDATE_SECRET}
{ "paths": ["/blog/my-post", "/blog", "/"] }
```

The list holds every affected public path: the item, its list page, `/` for anything that can appear on the home page, and `/about` for settings and experience. Course and story saves include their lesson and chapter pages (and courses linked to the course); settings saves include every list page because the layout reads them. If the site cannot be reached the save still succeeds and the editor shows "Saved. The public site could not be refreshed."

**Draft preview.** The Preview button opens `GET /api/preview?path=/blog/my-post` on the admin, which checks the session and redirects to:

```
{NEXT_PUBLIC_SITE_URL}/api/draft?path=<path>&exp=<unix seconds, now + 120>&sig=<hex HMAC-SHA256 of "<path>.<exp>" keyed with REVALIDATE_SECRET>
```

The secret never reaches the browser.

**Public paths** used by the admin: posts `/blog/[slug]`, projects `/projects/[slug]`, courses `/courses/[slug]` and lessons `/courses/[courseSlug]/[lessonSlug]`, stories `/stories/[slug]` and chapters `/stories/[storySlug]/[chapterSlug]`, publications `/research/[slug]`, galleries `/gallery` and `/gallery/[slug]`, about `/about`, home `/`.

## Media

Files go to the `media` bucket from the browser as the signed-in user, at `YYYY/MM/<slugified-name>-<6 random chars>.<ext>`, with a one year cache header and no upsert (50 MB per file). Image and video dimensions are read before upload and recorded in `media_assets`. Deleting from the library removes the storage object and the row.

## Markdown dialect

The editor preview renders exactly what the public site renders; `src/lib/markdown/plugins.ts` is a verbatim copy of the site's file and must stay identical.

- GitHub Flavored Markdown: tables, task lists, footnotes, strikethrough.
- Math: `$inline$` and `$$block$$` (KaTeX).
- Fenced code with a language. The site also understands `title="file.ts"`, `{1,3-5}` line highlights and `showLineNumbers` in the fence meta.
- Callouts: `> [!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, `[!CAUTION]`.
- Disclosure: `:::details[Summary]` ... `:::`.
- Images with an optional title as caption: `![alt](image.jpg "Caption")`.
- Media files by extension become players: mp4, webm, mov, m4v (video) and mp3, wav, ogg, m4a, flac (audio).
- A YouTube or Vimeo link alone on a line becomes an embed.
- Raw HTML is not rendered. Stray `:name` directive syntax is shown as plain text.

Bodies are autosaved to `localStorage` (keyed by table and id) while you type; if the tab dies before a save, the editor offers to restore the unsaved draft.
