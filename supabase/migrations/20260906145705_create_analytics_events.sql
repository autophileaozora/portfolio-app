-- Self-hosted visitor analytics (no third-party service) — one flexible
-- row per tracked event (pageview / click / scroll / error), covering the
-- data points the user asked to collect. IP/geo/browser/OS/device are
-- ALWAYS derived server-side in the ingestion endpoint from the request
-- itself (headers, Vercel's edge geo headers) — never trusted from
-- whatever the client claims, even though the client is the one sending
-- the request; only screen size/language/timezone/scroll/duration/click
-- labels genuinely can't be known any other way than the client reporting
-- them.
create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  is_new_session boolean not null default false,
  event_type text not null default 'pageview', -- pageview | click | scroll | error | duration

  path text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,

  ip_address text,
  country text,
  region text,
  city text,

  browser text,
  os text,
  device_type text, -- mobile | tablet | desktop
  screen_width smallint,
  screen_height smallint,
  language text,
  timezone text,

  duration_seconds integer,
  scroll_percent smallint,
  label text, -- click target text/href, or the error message
  metadata jsonb,

  created_at timestamptz not null default now()
);

create index analytics_events_session_id_idx on public.analytics_events (session_id);
create index analytics_events_created_at_idx on public.analytics_events (created_at desc);
create index analytics_events_event_type_idx on public.analytics_events (event_type);

comment on table public.analytics_events is 'Self-hosted visitor analytics — one row per tracked pageview/click/scroll/error event. Written by anon visitors (insert-only, no anon read), read by the admin dashboard.';

alter table public.analytics_events enable row level security;

-- Same shape as `messages`: anon may INSERT (that's the whole point — an
-- anonymous visitor's own browser is what sends these), no SELECT policy
-- exists for anon at all, so event data is unreadable by the public
-- (default-deny — RLS with zero matching policies blocks the action).
create policy "anon can submit an analytics event" on public.analytics_events
  for insert to anon
  with check (true);

create policy "authenticated full access to analytics_events" on public.analytics_events
  for all to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);
