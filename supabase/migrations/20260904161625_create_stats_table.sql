create table public.stats (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  value integer not null default 0,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index stats_display_order_idx on public.stats (display_order);
