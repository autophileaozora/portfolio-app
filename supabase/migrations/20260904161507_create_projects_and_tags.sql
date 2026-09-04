create table public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  short_description text not null default '',
  role text not null default '',
  duration text not null default '',
  category text not null default '',
  thumbnail_url text,
  contributors text not null default '',
  associated_with text not null default '',
  date_start date,
  date_end date,
  live_url text,
  is_published boolean not null default false,
  is_featured boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_display_order_idx on public.projects (display_order);

create trigger set_projects_updated_at
  before update on public.projects
  for each row
  execute function public.set_updated_at();

-- Tags are shared across projects (many-to-many via project_tags).
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  label text not null unique
);

create table public.project_tags (
  project_id uuid not null references public.projects (id) on delete cascade,
  tag_id uuid not null references public.tags (id) on delete cascade,
  display_order integer not null default 0,
  primary key (project_id, tag_id)
);

-- Powers the Problems / Solutions / Final Results cards AND the
-- documentation carousel on a project's detail page.
create table public.project_sections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  type text not null check (type in ('problem', 'solution', 'result', 'documentation')),
  title text not null default '',
  content text not null default '',
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index project_sections_project_id_idx on public.project_sections (project_id);

create trigger set_project_sections_updated_at
  before update on public.project_sections
  for each row
  execute function public.set_updated_at();
