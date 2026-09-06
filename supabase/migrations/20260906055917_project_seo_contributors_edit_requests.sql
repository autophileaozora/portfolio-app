-- ── SEO overrides ──
-- Optional per-project title/description for <title>/meta tags/OG/JSON-LD;
-- falls back to title/short_description when empty (handled in app code).
alter table public.projects
  add column meta_title text,
  add column meta_description text;

-- ── structured contributors (name + link) ──
-- Replaces the old free-text "Imanuel, Louis, Jonathan, Emma" column with a
-- real list so each contributor's name can link to their own social
-- profile. The old `contributors` text column is left in place (unused
-- going forward) rather than dropped, so no data is destroyed; existing
-- comma-separated names are carried over as {name, url: null} entries.
alter table public.projects
  add column contributors_list jsonb not null default '[]'::jsonb;

update public.projects
set contributors_list = (
  select coalesce(jsonb_agg(jsonb_build_object('name', btrim(name), 'url', null)), '[]'::jsonb)
  from unnest(string_to_array(contributors, ',')) as name
  where btrim(name) <> ''
)
where contributors is not null and btrim(contributors) <> '';

-- ── public "request edit" workflow ──
-- A visitor proposes changes to a published project; nothing is applied
-- until an admin reviews and approves it. Mirrors the messages table's
-- privacy shape: anon can INSERT a fresh pending request but can't read
-- any request (their own or anyone else's) back.
create table public.project_edit_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  requester_name text not null,
  requester_instagram text not null,
  requester_whatsapp text,
  proposed_changes jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,

  constraint project_edit_requests_name_not_blank check (btrim(requester_name) <> ''),
  constraint project_edit_requests_instagram_not_blank check (btrim(requester_instagram) <> '')
);

create index project_edit_requests_status_idx on public.project_edit_requests (status, created_at desc);

alter table public.project_edit_requests enable row level security;

create policy "anon can submit a pending edit request"
  on public.project_edit_requests for insert
  to anon
  with check (
    status = 'pending'
    and admin_note is null
    and reviewed_at is null
  );

create policy "authenticated full access to project_edit_requests"
  on public.project_edit_requests for all
  to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);
