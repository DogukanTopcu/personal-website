-- =============================================================================
-- Backgrounds: optional full-screen pictures behind every page of the site.
--
-- An option is a picture for the light theme, one for the dark theme, and how
-- much of each theme's own ground colour is laid over its picture (the veil),
-- which is what keeps text readable on top. The site shows the default,
-- site_settings.background_id, and null means no background at all. Visitors
-- may pick another option while site_settings.background_picker is on.
-- =============================================================================

create table public.backgrounds (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique check (char_length(name) between 1 and 60),
  light_url  text not null,
  dark_url   text,                -- null: the light picture serves both themes
  veil_light smallint not null default 60 check (veil_light between 0 and 95),
  veil_dark  smallint not null default 60 check (veil_dark between 0 and 95),
  position   integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index backgrounds_position_idx on public.backgrounds (position);

create trigger backgrounds_updated_at before update on public.backgrounds
  for each row execute function public.set_updated_at();

alter table public.backgrounds enable row level security;

create policy "Admins manage backgrounds" on public.backgrounds
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Reference data, like the galleries: always readable.
create policy "Public reads backgrounds" on public.backgrounds
  for select to anon, authenticated using (true);

alter table public.site_settings
  add column background_id uuid references public.backgrounds (id) on delete set null,
  add column background_picker boolean not null default true;
