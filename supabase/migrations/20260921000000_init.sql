-- ============================================================================
-- Personal site schema
-- Public site reads with the anon key (RLS: published rows only).
-- Admin panel writes as an authenticated user listed in public.admins.
-- ============================================================================

create type public.content_status as enum ('draft', 'published', 'archived');

-- ---------------------------------------------------------------- helpers --

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Words / 220, minimum 1. Shared by every table that carries markdown.
create or replace function public.estimate_reading_minutes(md text)
returns integer
language sql
immutable
set search_path = ''
as $$
  select greatest(
    1,
    ceil(coalesce(array_length(regexp_split_to_array(btrim(coalesce(md, '')), '\s+'), 1), 0) / 220.0)::int
  );
$$;

create or replace function public.set_reading_minutes()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.reading_minutes = public.estimate_reading_minutes(new.content_md);
  return new;
end;
$$;

-- A row goes live the moment it is published unless a date was chosen.
create or replace function public.set_published_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at = now();
  end if;
  return new;
end;
$$;

-- ----------------------------------------------------------------- admins --

create table public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins a where a.user_id = (select auth.uid())
  );
$$;

-- Run from the SQL editor (or the create-admin script) after creating the auth
-- user. Not callable with the anon or authenticated keys.
create or replace function public.grant_admin(target_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid;
begin
  select id into uid from auth.users where email = target_email;
  if uid is null then
    raise exception 'No auth user with email %', target_email;
  end if;
  insert into public.admins (user_id) values (uid) on conflict do nothing;
end;
$$;

revoke all on function public.grant_admin(text) from public, anon, authenticated;

create policy "Admins can read the admin list"
  on public.admins for select to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------- site settings --

create table public.site_settings (
  id           integer primary key default 1 check (id = 1),
  full_name    text not null default '',
  headline     text not null default '',
  intro        text not null default '',
  bio_md       text not null default '',
  now_md       text not null default '',
  location     text not null default '',
  email        text not null default '',
  avatar_url   text,
  avatar_alt   text not null default '',
  resume_url   text,
  socials      jsonb not null default '[]'::jsonb,  -- [{label, url, handle}]
  skills       jsonb not null default '[]'::jsonb,  -- [{group, items: []}]
  interests    text[] not null default '{}',
  home_copy    jsonb not null default '{}'::jsonb,  -- per-waypoint overrides
  site_title   text not null default '',
  site_description text not null default '',
  site_url     text not null default '',
  og_image_url text,
  updated_at   timestamptz not null default now()
);

create trigger site_settings_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------ experiences --

create table public.experiences (
  id           uuid primary key default gen_random_uuid(),
  kind         text not null check (kind in ('work', 'venture', 'education', 'leadership', 'award')),
  title        text not null,
  organization text not null default '',
  location     text not null default '',
  url          text,
  start_date   date,               -- year precision is fine; null when unknown
  end_date     date,
  is_current   boolean not null default false,
  summary      text not null default '',
  highlights   text[] not null default '{}',
  position     integer not null default 0,
  status       public.content_status not null default 'published',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger experiences_updated_at before update on public.experiences
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------- categories --

create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null check (kind in ('post', 'project')),
  slug        text not null,
  name        text not null,
  description text not null default '',
  cover_url   text,               -- fallback cover for entries without one
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (kind, slug)
);

create trigger categories_updated_at before update on public.categories
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------------ posts --

create table public.posts (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  title           text not null,
  excerpt         text not null default '',
  cover_url       text,
  cover_alt       text not null default '',
  category_id     uuid references public.categories (id) on delete set null,
  tags            text[] not null default '{}',
  content_md      text not null default '',
  reading_minutes integer not null default 1,
  -- Reviews (books, films, games): {subject, creator, year, rating, verdict}
  review          jsonb,
  featured        boolean not null default false,
  status          public.content_status not null default 'draft',
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  search          tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(excerpt, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(content_md, '')), 'C')
  ) stored
);

create index posts_listing_idx on public.posts (status, published_at desc);
create index posts_category_idx on public.posts (category_id);
create index posts_tags_idx on public.posts using gin (tags);
create index posts_search_idx on public.posts using gin (search);

create trigger posts_updated_at before update on public.posts
  for each row execute function public.set_updated_at();
create trigger posts_reading_minutes before insert or update of content_md on public.posts
  for each row execute function public.set_reading_minutes();
create trigger posts_published_at before insert or update of status on public.posts
  for each row execute function public.set_published_at();

-- --------------------------------------------------------------- projects --

create table public.projects (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  title           text not null,
  summary         text not null default '',
  cover_url       text,
  cover_alt       text not null default '',
  category_id     uuid references public.categories (id) on delete set null,
  role            text not null default '',
  tech            text[] not null default '{}',
  started_on      date,
  ended_on        date,
  is_ongoing      boolean not null default false,
  repo_url        text,
  live_url        text,
  gallery         jsonb not null default '[]'::jsonb,  -- [{url, alt, caption}]
  content_md      text not null default '',
  reading_minutes integer not null default 1,
  featured        boolean not null default false,
  position        integer not null default 0,
  status          public.content_status not null default 'draft',
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  search          tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(content_md, '')), 'C')
  ) stored
);

create index projects_listing_idx on public.projects (status, position, published_at desc);
create index projects_category_idx on public.projects (category_id);
create index projects_search_idx on public.projects using gin (search);

create trigger projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();
create trigger projects_reading_minutes before insert or update of content_md on public.projects
  for each row execute function public.set_reading_minutes();
create trigger projects_published_at before insert or update of status on public.projects
  for each row execute function public.set_published_at();

-- ---------------------------------------------------------------- courses --

create table public.courses (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  title          text not null,
  summary        text not null default '',
  description_md text not null default '',
  cover_url      text,
  cover_alt      text not null default '',
  level          text not null default 'beginner' check (level in ('beginner', 'intermediate', 'advanced')),
  topics         text[] not null default '{}',
  featured       boolean not null default false,
  position       integer not null default 0,
  status         public.content_status not null default 'draft',
  published_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  search         tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description_md, '')), 'C')
  ) stored
);

create index courses_listing_idx on public.courses (status, position, published_at desc);
create index courses_search_idx on public.courses using gin (search);

create trigger courses_updated_at before update on public.courses
  for each row execute function public.set_updated_at();
create trigger courses_published_at before insert or update of status on public.courses
  for each row execute function public.set_published_at();

-- Courses link to each other: what to take before, what to take next.
create table public.course_links (
  course_id        uuid not null references public.courses (id) on delete cascade,
  linked_course_id uuid not null references public.courses (id) on delete cascade,
  relation         text not null check (relation in ('prerequisite', 'next', 'related')),
  position         integer not null default 0,
  primary key (course_id, linked_course_id, relation),
  check (course_id <> linked_course_id)
);

create table public.lessons (
  id              uuid primary key default gen_random_uuid(),
  course_id       uuid not null references public.courses (id) on delete cascade,
  slug            text not null,
  title           text not null,
  summary         text not null default '',
  section_title   text not null default '',   -- groups lessons into modules
  position        integer not null default 0,
  video_url       text,
  content_md      text not null default '',
  reading_minutes integer not null default 1,
  status          public.content_status not null default 'draft',
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  search          tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(content_md, '')), 'C')
  ) stored,
  unique (course_id, slug)
);

create index lessons_course_idx on public.lessons (course_id, position);
create index lessons_search_idx on public.lessons using gin (search);

create trigger lessons_updated_at before update on public.lessons
  for each row execute function public.set_updated_at();
create trigger lessons_reading_minutes before insert or update of content_md on public.lessons
  for each row execute function public.set_reading_minutes();
create trigger lessons_published_at before insert or update of status on public.lessons
  for each row execute function public.set_published_at();

-- ---------------------------------------------------------------- stories --

create table public.stories (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  synopsis     text not null default '',
  cover_url    text,
  cover_alt    text not null default '',
  format       text not null default 'short-story' check (format in ('novel', 'novella', 'short-story', 'collection', 'serial')),
  genre        text not null default '',
  is_complete  boolean not null default false,
  featured     boolean not null default false,
  position     integer not null default 0,
  status       public.content_status not null default 'draft',
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  search       tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(synopsis, '')), 'B')
  ) stored
);

create index stories_listing_idx on public.stories (status, position, published_at desc);
create index stories_search_idx on public.stories using gin (search);

create trigger stories_updated_at before update on public.stories
  for each row execute function public.set_updated_at();
create trigger stories_published_at before insert or update of status on public.stories
  for each row execute function public.set_published_at();

create table public.chapters (
  id              uuid primary key default gen_random_uuid(),
  story_id        uuid not null references public.stories (id) on delete cascade,
  slug            text not null,
  title           text not null,
  part_title      text not null default '',   -- groups chapters into parts
  position        integer not null default 0,
  content_md      text not null default '',
  reading_minutes integer not null default 1,
  status          public.content_status not null default 'draft',
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (story_id, slug)
);

create index chapters_story_idx on public.chapters (story_id, position);

create trigger chapters_updated_at before update on public.chapters
  for each row execute function public.set_updated_at();
create trigger chapters_reading_minutes before insert or update of content_md on public.chapters
  for each row execute function public.set_reading_minutes();
create trigger chapters_published_at before insert or update of status on public.chapters
  for each row execute function public.set_published_at();

-- ----------------------------------------------------------- publications --

create table public.publications (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  title        text not null,
  authors      text[] not null default '{}',
  kind         text not null default 'preprint' check (kind in ('thesis', 'journal', 'conference', 'preprint', 'report', 'talk')),
  venue        text not null default '',
  year         integer not null,
  published_on date,
  abstract     text not null default '',
  keywords     text[] not null default '{}',
  pdf_url      text,
  doi          text,
  url          text,
  bibtex       text not null default '',
  featured     boolean not null default false,
  status       public.content_status not null default 'draft',
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  search       tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(abstract, '')), 'B')
  ) stored
);

create index publications_listing_idx on public.publications (status, year desc);
create index publications_search_idx on public.publications using gin (search);

create trigger publications_updated_at before update on public.publications
  for each row execute function public.set_updated_at();
create trigger publications_published_at before insert or update of status on public.publications
  for each row execute function public.set_published_at();

-- -------------------------------------------------------------- galleries --

create table public.galleries (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  title       text not null,
  description text not null default '',
  cover_url   text,
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger galleries_updated_at before update on public.galleries
  for each row execute function public.set_updated_at();

create table public.gallery_items (
  id           uuid primary key default gen_random_uuid(),
  gallery_id   uuid not null references public.galleries (id) on delete cascade,
  title        text not null default '',
  caption      text not null default '',
  alt          text not null default '',
  media_url    text not null,
  media_type   text not null default 'image' check (media_type in ('image', 'video')),
  poster_url   text,
  width        integer,
  height       integer,
  made_on      date,
  meta         jsonb not null default '{}'::jsonb,  -- {medium, camera, lens, tools, ...}
  tags         text[] not null default '{}',
  featured     boolean not null default false,
  position     integer not null default 0,
  status       public.content_status not null default 'published',
  published_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index gallery_items_listing_idx on public.gallery_items (gallery_id, status, position);

create trigger gallery_items_updated_at before update on public.gallery_items
  for each row execute function public.set_updated_at();
create trigger gallery_items_published_at before insert or update of status on public.gallery_items
  for each row execute function public.set_published_at();

-- ---------------------------------------------------------- media library --

create table public.media_assets (
  id         uuid primary key default gen_random_uuid(),
  path       text not null unique,        -- object path inside the media bucket
  url        text not null,
  mime_type  text not null default '',
  size_bytes bigint not null default 0,
  width      integer,
  height     integer,
  alt        text not null default '',
  created_at timestamptz not null default now()
);

create index media_assets_created_idx on public.media_assets (created_at desc);

-- ------------------------------------------------------------------- RLS --

alter table public.site_settings enable row level security;
alter table public.experiences   enable row level security;
alter table public.categories    enable row level security;
alter table public.posts         enable row level security;
alter table public.projects      enable row level security;
alter table public.courses       enable row level security;
alter table public.course_links  enable row level security;
alter table public.lessons       enable row level security;
alter table public.stories       enable row level security;
alter table public.chapters      enable row level security;
alter table public.publications  enable row level security;
alter table public.galleries     enable row level security;
alter table public.gallery_items enable row level security;
alter table public.media_assets  enable row level security;

-- Admin: everything, everywhere.
do $$
declare
  t text;
begin
  foreach t in array array[
    'site_settings', 'experiences', 'categories', 'posts', 'projects', 'courses',
    'course_links', 'lessons', 'stories', 'chapters', 'publications', 'galleries',
    'gallery_items', 'media_assets'
  ]
  loop
    execute format(
      'create policy "Admins manage %1$s" on public.%1$I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
      t
    );
  end loop;
end;
$$;

-- Public: reference data is always readable.
create policy "Public reads site settings" on public.site_settings
  for select to anon, authenticated using (true);
create policy "Public reads categories" on public.categories
  for select to anon, authenticated using (true);
create policy "Public reads galleries" on public.galleries
  for select to anon, authenticated using (true);

-- Public: content is readable once published and its date has arrived, which
-- is also what makes scheduled publishing work with no extra machinery.
create policy "Public reads published experiences" on public.experiences
  for select to anon, authenticated using (status = 'published');

create policy "Public reads published posts" on public.posts
  for select to anon, authenticated
  using (status = 'published' and published_at <= now());

create policy "Public reads published projects" on public.projects
  for select to anon, authenticated
  using (status = 'published' and published_at <= now());

create policy "Public reads published courses" on public.courses
  for select to anon, authenticated
  using (status = 'published' and published_at <= now());

create policy "Public reads links between published courses" on public.course_links
  for select to anon, authenticated
  using (
    exists (select 1 from public.courses c where c.id = course_id and c.status = 'published' and c.published_at <= now())
    and exists (select 1 from public.courses c where c.id = linked_course_id and c.status = 'published' and c.published_at <= now())
  );

create policy "Public reads published lessons" on public.lessons
  for select to anon, authenticated
  using (
    status = 'published' and published_at <= now()
    and exists (select 1 from public.courses c where c.id = course_id and c.status = 'published' and c.published_at <= now())
  );

create policy "Public reads published stories" on public.stories
  for select to anon, authenticated
  using (status = 'published' and published_at <= now());

create policy "Public reads published chapters" on public.chapters
  for select to anon, authenticated
  using (
    status = 'published' and published_at <= now()
    and exists (select 1 from public.stories s where s.id = story_id and s.status = 'published' and s.published_at <= now())
  );

create policy "Public reads published publications" on public.publications
  for select to anon, authenticated
  using (status = 'published' and published_at <= now());

create policy "Public reads published gallery items" on public.gallery_items
  for select to anon, authenticated
  using (status = 'published' and published_at <= now());

-- ----------------------------------------------------------------- search --

-- One query across everything a visitor can read. SECURITY INVOKER, so the
-- policies above decide what comes back.
create or replace function public.search_site(q text, max_results integer default 30)
returns table (
  kind     text,
  title    text,
  summary  text,
  url      text,
  rank     real
)
language sql
stable
set search_path = ''
as $$
  with query as (select websearch_to_tsquery('english', q) as tsq)
  select * from (
    select 'post'::text, p.title, p.excerpt, '/blog/' || p.slug, ts_rank(p.search, query.tsq)
      from public.posts p, query where p.search @@ query.tsq
    union all
    select 'project', p.title, p.summary, '/projects/' || p.slug, ts_rank(p.search, query.tsq)
      from public.projects p, query where p.search @@ query.tsq
    union all
    select 'course', c.title, c.summary, '/courses/' || c.slug, ts_rank(c.search, query.tsq)
      from public.courses c, query where c.search @@ query.tsq
    union all
    select 'lesson', l.title, l.summary, '/courses/' || c.slug || '/' || l.slug, ts_rank(l.search, query.tsq)
      from public.lessons l join public.courses c on c.id = l.course_id, query where l.search @@ query.tsq
    union all
    select 'story', s.title, s.synopsis, '/stories/' || s.slug, ts_rank(s.search, query.tsq)
      from public.stories s, query where s.search @@ query.tsq
    union all
    select 'publication', b.title, b.abstract, '/research/' || b.slug, ts_rank(b.search, query.tsq)
      from public.publications b, query where b.search @@ query.tsq
  ) as hits (kind, title, summary, url, rank)
  order by rank desc
  limit least(greatest(max_results, 1), 50);
$$;

grant execute on function public.search_site(text, integer) to anon, authenticated;

-- ---------------------------------------------------------------- storage --

insert into storage.buckets (id, name, public, file_size_limit)
values ('media', 'media', true, 52428800)
on conflict (id) do nothing;

create policy "Anyone can read media"
  on storage.objects for select
  using (bucket_id = 'media');

create policy "Admins upload media"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_admin());

create policy "Admins update media"
  on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_admin())
  with check (bucket_id = 'media' and public.is_admin());

create policy "Admins delete media"
  on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_admin());

-- ------------------------------------------------------ fixed reference rows --

insert into public.site_settings (id) values (1) on conflict (id) do nothing;

insert into public.categories (kind, slug, name, description, position) values
  ('post', 'books',  'Books',  'Reviews and notes on the books I read.', 1),
  ('post', 'films',  'Films',  'Mostly twentieth century cinema, reviewed.', 2),
  ('post', 'games',  'Games',  'Games I played and what stayed with me.', 3),
  ('post', 'essays', 'Essays', 'One-off pieces on subjects I find interesting.', 4),
  ('project', 'software-engineering',    'Software Engineering',    'Web, desktop, mobile and backend systems.', 1),
  ('project', 'game-development',        'Game Development',        'Games and tools built mostly with Unity.', 2),
  ('project', 'robotics',                'Robotics',                'Hardware, control and embedded work.', 3),
  ('project', 'machine-learning',        'Machine Learning',        'Models, training runs and experiments.', 4),
  ('project', 'artificial-intelligence', 'Artificial Intelligence', 'Language models, generative systems and agents.', 5)
on conflict (kind, slug) do nothing;

insert into public.galleries (slug, title, description, position) values
  ('drawings',    'Drawings',     'Charcoal, graphite and ink.', 1),
  ('photography', 'Photography',  'Photographs I took.', 2),
  ('digital-art', 'Digital Art',  'Data visualisation, generative pieces and animation.', 3),
  ('ui-design',   'UI Design',    'Interfaces I designed.', 4)
on conflict (slug) do nothing;
