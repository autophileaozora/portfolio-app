-- ── smart reorder ──
-- Make the four display_order unique constraints deferrable: a reorder now
-- shifts every row between the old and new position in one transaction
-- (via reorder_ranked_item below), which transiently puts two rows on the
-- same value until the final statement runs. A plain (non-deferrable)
-- unique constraint would reject that mid-transaction state; deferring the
-- check to commit time lets the whole shift land atomically.
alter table public.skills
  drop constraint skills_display_order_unique,
  add constraint skills_display_order_unique unique (display_order) deferrable initially deferred;

alter table public.stats
  drop constraint stats_display_order_unique,
  add constraint stats_display_order_unique unique (display_order) deferrable initially deferred;

alter table public.experience
  drop constraint experience_display_order_unique,
  add constraint experience_display_order_unique unique (display_order) deferrable initially deferred;

alter table public.testimonials
  drop constraint testimonials_display_order_unique,
  add constraint testimonials_display_order_unique unique (display_order) deferrable initially deferred;

-- Moves target_id to new_order, shifting every row in between by one, so
-- the caller never has to touch any other row's order itself. security
-- invoker (the default) on purpose — it runs as the calling admin user, so
-- the existing RLS "authenticated full access" policy is what actually
-- authorizes the writes, not this function.
create or replace function public.reorder_ranked_item(
  target_table text,
  target_id uuid,
  new_order integer
) returns void
language plpgsql
set search_path = public
as $$
declare
  old_order integer;
begin
  if target_table not in ('skills', 'stats', 'experience', 'testimonials') then
    raise exception 'reorder_ranked_item: invalid table %', target_table;
  end if;

  execute format('select display_order from public.%I where id = $1', target_table)
    into old_order using target_id;

  if old_order is null then
    raise exception 'reorder_ranked_item: row % not found in %', target_id, target_table;
  end if;

  if new_order = old_order then
    return;
  end if;

  if new_order < old_order then
    execute format(
      'update public.%I set display_order = display_order + 1 where display_order >= $1 and display_order < $2',
      target_table
    ) using new_order, old_order;
  else
    execute format(
      'update public.%I set display_order = display_order - 1 where display_order > $1 and display_order <= $2',
      target_table
    ) using old_order, new_order;
  end if;

  execute format('update public.%I set display_order = $1 where id = $2', target_table)
    using new_order, target_id;
end;
$$;

revoke all on function public.reorder_ranked_item(text, uuid, integer) from public;
grant execute on function public.reorder_ranked_item(text, uuid, integer) to authenticated;

-- Closes the gap left by a delete, so display_order stays a dense 1..N and
-- "create" can keep assigning max+1 without the sequence drifting forever.
create or replace function public.compact_ranked_table(
  target_table text,
  deleted_order integer
) returns void
language plpgsql
set search_path = public
as $$
begin
  if target_table not in ('skills', 'stats', 'experience', 'testimonials') then
    raise exception 'compact_ranked_table: invalid table %', target_table;
  end if;

  execute format('update public.%I set display_order = display_order - 1 where display_order > $1', target_table)
    using deleted_order;
end;
$$;

revoke all on function public.compact_ranked_table(text, integer) from public;
grant execute on function public.compact_ranked_table(text, integer) to authenticated;

-- ── storage: profile avatar + CV/resume uploads ──
insert into storage.buckets (id, name, public)
values ('public-assets', 'public-assets', true)
on conflict (id) do nothing;

create policy "public read for public-assets"
  on storage.objects for select
  to public
  using (bucket_id = 'public-assets');

create policy "authenticated can upload to public-assets"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'public-assets');

create policy "authenticated can update public-assets"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'public-assets')
  with check (bucket_id = 'public-assets');

create policy "authenticated can delete from public-assets"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'public-assets');

-- ── data cleanup: normalize experience.role_type to the fixed select options ──
update public.experience set role_type = 'Internship' where role_type = '(Intern)';
update public.experience set role_type = 'Freelance' where role_type = '(Freelance)';
update public.experience set role_type = 'Part-time' where role_type = '(Part Timer)';
update public.experience set role_type = 'Project-based' where role_type = '(Project Based)';
