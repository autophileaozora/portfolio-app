create table public.experience (
  id uuid primary key default gen_random_uuid(),
  role_title text not null,
  role_type text not null default '',
  company_name text not null default '',
  date_start date,
  date_end date,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index experience_display_order_idx on public.experience (display_order);

create trigger set_experience_updated_at
  before update on public.experience
  for each row
  execute function public.set_updated_at();
