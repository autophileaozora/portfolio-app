-- RLS shape (see the migration plan for the full rationale):
--   anon      -> SELECT on published/public content only, INSERT-only on messages
--   authenticated -> full CRUD everywhere (acceptable as a blanket rule because
--                     there is exactly one admin account; tighten first if that
--                     ever changes)

alter table public.profile enable row level security;
alter table public.projects enable row level security;
alter table public.tags enable row level security;
alter table public.project_tags enable row level security;
alter table public.project_sections enable row level security;
alter table public.experience enable row level security;
alter table public.skills enable row level security;
alter table public.testimonials enable row level security;
alter table public.stats enable row level security;
alter table public.messages enable row level security;

-- ── profile ── (no publish flag; always public)
create policy "anon can read profile" on public.profile
  for select to anon using (true);

create policy "authenticated full access to profile" on public.profile
  for all to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);

-- ── projects ──
create policy "anon can read published projects" on public.projects
  for select to anon using (is_published = true);

create policy "authenticated full access to projects" on public.projects
  for all to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);

-- ── tags ── (no publish flag of its own; a tag label is not sensitive)
create policy "anon can read tags" on public.tags
  for select to anon using (true);

create policy "authenticated full access to tags" on public.tags
  for all to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);

-- ── project_tags ── (only expose links for published projects)
create policy "anon can read tags of published projects" on public.project_tags
  for select to anon using (
    exists (
      select 1 from public.projects
      where projects.id = project_tags.project_id
        and projects.is_published = true
    )
  );

create policy "authenticated full access to project_tags" on public.project_tags
  for all to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);

-- ── project_sections ── (only expose sections of published projects)
create policy "anon can read sections of published projects" on public.project_sections
  for select to anon using (
    exists (
      select 1 from public.projects
      where projects.id = project_sections.project_id
        and projects.is_published = true
    )
  );

create policy "authenticated full access to project_sections" on public.project_sections
  for all to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);

-- ── experience ── (no publish flag; always public)
create policy "anon can read experience" on public.experience
  for select to anon using (true);

create policy "authenticated full access to experience" on public.experience
  for all to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);

-- ── skills ── (no publish flag; always public)
create policy "anon can read skills" on public.skills
  for select to anon using (true);

create policy "authenticated full access to skills" on public.skills
  for all to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);

-- ── testimonials ──
create policy "anon can read published testimonials" on public.testimonials
  for select to anon using (is_published = true);

create policy "authenticated full access to testimonials" on public.testimonials
  for all to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);

-- ── stats ── (no publish flag; always public)
create policy "anon can read stats" on public.stats
  for select to anon using (true);

create policy "authenticated full access to stats" on public.stats
  for all to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);

-- ── messages ── anon may only INSERT a fresh, unanswered message; no SELECT
-- policy exists for anon at all, so message contents are unreadable by the
-- public (default-deny — RLS with zero matching policies blocks the action).
create policy "anon can submit a message" on public.messages
  for insert to anon
  with check (
    status = 'pending'
    and admin_reply is null
    and replied_at is null
  );

create policy "authenticated full access to messages" on public.messages
  for all to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);
