create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  author_name text not null,
  author_role text not null default '',
  quote text not null,
  is_published boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index testimonials_display_order_idx on public.testimonials (display_order);

create trigger set_testimonials_updated_at
  before update on public.testimonials
  for each row
  execute function public.set_updated_at();
