-- Singleton row: the Home page's hero/profile content.
create table public.profile (
  id smallint primary key default 1,
  full_name text not null default '',
  title text not null default '',
  location text not null default '',
  avatar_url text,
  email text not null default '',
  social_linkedin text,
  social_github text,
  social_instagram text,
  social_whatsapp text,
  cv_url text,
  resume_url text,
  summary_paragraph text not null default '',
  updated_at timestamptz not null default now(),

  constraint profile_singleton check (id = 1)
);

comment on table public.profile is 'Singleton row (id always 1) — Home page hero content.';

create trigger set_profile_updated_at
  before update on public.profile
  for each row
  execute function public.set_updated_at();
