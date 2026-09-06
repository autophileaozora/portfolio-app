-- Dedicated site-wide SEO settings, separate from `profile` (personal
-- info) per the user's explicit request for a distinct admin page: the
-- browser-tab favicon, the default social-share thumbnail image (og_image_url,
-- distinct from the avatar since a banner-style share image is often
-- preferred over a face photo), a site name, and a slot for the Google
-- Search Console verification meta tag (so future re-verification doesn't
-- need a code deploy + static HTML file, just an admin form edit).
create table public.seo_settings (
  id smallint primary key default 1,
  site_name text not null default '',
  favicon_url text,
  og_image_url text,
  google_site_verification text,
  updated_at timestamptz not null default now(),

  constraint seo_settings_singleton check (id = 1)
);

comment on table public.seo_settings is 'Singleton row (id always 1) — site-wide SEO settings (favicon, default share image, site name, search-engine verification meta tag).';

create trigger set_seo_settings_updated_at
  before update on public.seo_settings
  for each row
  execute function public.set_updated_at();

alter table public.seo_settings enable row level security;

-- Same shape as `profile`'s policies: no publish flag, always public.
create policy "anon can read seo_settings" on public.seo_settings
  for select to anon using (true);

create policy "authenticated full access to seo_settings" on public.seo_settings
  for all to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);

insert into public.seo_settings (id, site_name)
values (1, 'Hello Imanuel — Web Developer & IT Support')
on conflict (id) do nothing;
