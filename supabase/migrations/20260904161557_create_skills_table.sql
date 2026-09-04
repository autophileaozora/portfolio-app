create table public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index skills_display_order_idx on public.skills (display_order);
