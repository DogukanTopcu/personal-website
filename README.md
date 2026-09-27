# dogukantopcu.com

A personal site: writing, courses, projects, stories, research and galleries.
Three parts.

| Folder | What it is | Port |
| --- | --- | --- |
| `site/` | The public site. Next.js 16, App Router. Design: **Sade** (plain and focused). | 3103 |
| `admin/` | The admin panel, a separate Next.js app. | 3101 |
| `supabase/` | The schema, its migration and the seed content. | 54321 |

Everything visitors read is stored in Supabase and written through the admin
panel. The public site never writes.

`web/` (Draft to Ink) and `darkroom/` (Darkroom) are the two earlier design
prototypes. They read the same database and still run, but nothing depends on
them any more; see [Retiring the prototypes](#retiring-the-prototypes).

## Running it locally

You need Docker (for Supabase), Node 20 or newer, and pnpm.

```bash
pnpm install
pnpm --dir site install
pnpm --dir admin install
supabase start          # first run pulls a few GB of images
supabase migration up
```

`supabase start` prints an API URL, an anon key and a service role key. Put
them in three files, which are git-ignored:

- `site/.env.local` needs `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`, `REVALIDATE_SECRET`, and
  `NEXT_PUBLIC_SITE_URL=http://localhost:3103`.
- `admin/.env.local` needs `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `REVALIDATE_SECRET`, and `NEXT_PUBLIC_SITE_URL=http://localhost:3103`, the
  site it refreshes and previews. `admin/.env.example` documents each one.
- `.env.local` at the root needs `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
  for the scripts.

`REVALIDATE_SECRET` must be the same string in `site` and `admin`. Generate one
with `openssl rand -hex 24`.

Then:

```bash
pnpm seed              # sample content; re-running overwrites the sample rows
pnpm admin:create      # creates your admin account, asks for the password
pnpm dev:site          # http://localhost:3103
pnpm dev:admin         # http://localhost:3101
```

Once the site is in use, seed one part at a time so nothing edited in the
admin is written over: `pnpm seed --only backgrounds` (sections: settings,
experiences, categories, posts, projects, courses, stories, publications,
gallery, backgrounds).

`pnpm admin:create` is the only way in. There is no sign-up page: the script
creates the auth user and adds it to `public.admins`, which is what every row
level security policy checks. To promote an account that already exists, run
`select public.grant_admin('you@example.com');` in the SQL editor.

## The design

One centred column, one typeface (Geist, with Geist Mono for dates and code),
near-white and near-black grounds, one blue accent for focus and hover, light
and dark themes. The tokens are in `design/design-dna-sade.json` and at the top
of `site/src/app/globals.css`. The admin panel uses the same tokens, and its
Markdown preview copies the site's text styles so a draft looks the way it
will be read.

### What the home page is made of

Nothing on the home page is written into the code; it is all edited in the
admin panel.

| On the page | Where it comes from |
| --- | --- |
| "Hi, I'm Doğukan." | Settings, Full name (its first word) |
| The paragraph under it | Settings, Intro |
| The round photo | Settings, Avatar; your initials until there is one |
| Now | Experience entries marked Current |
| Studied | The first Education entry |
| Based in, Elsewhere | Settings, Location and Social links |
| Get in touch | Settings, Email; LinkedIn while that is empty |
| Writing | The five newest posts. A post marked **Pinned** stays at the top, with a pin |
| Courses, Projects, Stories, Research | The first few of each, with those marked **Featured** first |
| Gallery | Four pieces, featured first. The section appears once one is published |

Lessons read like documentation: on wide screens the course's lessons sit on
the left and the lesson's headings on the right; on phones the lessons fold
into a list above the text.

### Backgrounds

An optional full-screen picture can sit behind every page. Each option is a
picture for the light theme and one for the dark theme, plus a veil: how much
of the theme's own ground colour lies over the picture, which is what keeps
text readable on top. Admin, **Backgrounds**:

- add, edit, delete and reorder options (pictures come from the media library);
- choose the default, including **No background**, the plain page;
- **Let visitors choose** adds a button to the site's header listing every
  option; a visitor's choice is kept in their own browser.

The site decides which one to paint before the first frame, in a small inline
script (`site/src/lib/background.ts`), so nothing flashes. `?background=<id>`
on any URL previews an option without saving anything, which is what the
admin's preview button opens.

The four starting options (Paper, Window light, Mist, Sea) were generated with
MarketingX (Nano Banana 2; the dark ones from the light ones as references so
each pair shares a composition; three upscaled with SeedVR) and are in
`supabase/seed/backgrounds/`. Their veils were set so the faintest text on the
site keeps 4.5:1 contrast over the busiest part of each picture; lowering a
veil in the admin trades some of that away.

## How the apps talk

They share a database and two small contracts.

**Refreshing the public site.** After every successful save the admin posts to
`${NEXT_PUBLIC_SITE_URL}/api/revalidate` with an `x-revalidate-secret` header
and `{ "paths": ["/blog/a-post", "/blog", "/"] }`. Saving the settings sends
`"all": true` as well, because the header and footer of every page read them.
A failure there never fails the save; the admin shows a warning and the page
refreshes on its own within five minutes. `REVALIDATE_EXTRA_URLS` in the admin
(comma separated, optional) refreshes further copies, such as a staging deploy.

**Previewing a draft.** The admin builds a link to
`${NEXT_PUBLIC_SITE_URL}/api/draft?path=…&exp=…&sig=…`, where `sig` is
`HMAC-SHA256("<path>.<exp>")` keyed with `REVALIDATE_SECRET`. The link lasts two
minutes. The public site checks the signature, turns on draft mode, and renders
the unpublished row exactly as it will look once it is live. Publications have
no page of their own, so theirs point at their entry on `/research`.

## What the database enforces

Row level security, not application code, decides what a visitor can see:

- Visitors read a row only when `status = 'published'` **and** `published_at`
  has passed. Setting a future date is therefore all that scheduling needs.
- A lesson is visible only if its course is, and a chapter only if its story is.
- Writing anything requires a signed-in user listed in `public.admins`.
- Uploaded media is publicly readable and admin-writable.

`site_settings.home_copy` is left over from the first design. Nothing reads or
writes it now; it can be dropped in a later migration.

## Writing format

Markdown, with a few additions the site renders:

- GitHub Flavored Markdown: tables, task lists, footnotes, strikethrough.
- Maths: `$inline$` and `$$block$$`, rendered with KaTeX.
- Code fences with a language, plus optional `title="file.ts"`, `{1,3-5}` to
  highlight lines, and `showLineNumbers`.
- Callouts: a blockquote starting `[!NOTE]`, `[!TIP]`, `[!IMPORTANT]`,
  `[!WARNING]` or `[!CAUTION]`.
- Collapsible blocks: `:::details[Summary]` … `:::`.
- An image with a title becomes a figure with a caption.
- A link to an `.mp4`, `.mp3` or similar file becomes a player.
- A YouTube or Vimeo link alone on a line becomes an embed that only loads when
  the reader clicks it.

The dialect is defined once in `site/src/lib/markdown/plugins.ts` and copied
into the admin so the editor preview and the site cannot drift apart.

## Checks

```bash
pnpm --dir site exec tsc --noEmit
pnpm --dir site lint
pnpm --dir site build
pnpm --dir admin exec tsc --noEmit
pnpm --dir admin lint

node scripts/shoot-pages.mjs --url http://localhost:3103 --out scrollcraft/builds/sade/lab/pages-light
node scripts/shoot-pages.mjs --url http://localhost:3103 --out scrollcraft/builds/sade/lab/pages-dark --scheme dark
node scripts/shoot-pages.mjs --url http://localhost:3103 --out scrollcraft/builds/sade/lab/pages-mobile --width 390 --height 844
```

`shoot-pages.mjs` loads the home page and every section, and reports console
errors, failed requests, horizontal overflow, contrast failures, wrapped
buttons, small tap targets, and any em dash that reached the screen. It writes
a contact sheet; `--full` takes full-page screenshots. Run the dev server
first. The 404 page reports its own 404, which is expected.

## Going live

1. Create a Supabase project, then `supabase link` and `supabase db push`.
2. Deploy `site/` and `admin/` separately. Give each the environment variables
   above, pointing at the cloud project, with `NEXT_PUBLIC_SITE_URL` set to the
   public site's real address in both.
3. Run `pnpm admin:create` against the cloud project.
4. Fill in Settings in the admin panel. Everything on the home page and in the
   footer reads from there.

Not configured yet: a custom domain, analytics, and a contact form. "Get in
touch" links to the email address in Settings, or to LinkedIn while that is
empty.

## Retiring the prototypes

`web/` and `darkroom/` can be deleted once they are no longer wanted: remove the
folders, their `dev:` and `build:` scripts from the root `package.json`, and
their entries in `.claude/launch.json`. Nothing in `site/`, `admin/` or
`supabase/` refers to them. Their design notes are in `design/design-dna.json`,
`design/design-dna-darkroom.json` and `scrollcraft/builds/`.
